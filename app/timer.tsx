import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import KeyCanvas from '../components/KeyCanvas';
import { keyAppear, rise } from '../components/motion';
import PressableScale from '../components/PressableScale';
import TimeRuler from '../components/TimeRuler';
import * as ScreenTime from '../modules/screen-time';
import { useLock } from '../stores/lock';
import { remainingMs, useUsage } from '../stores/usage';

const MINUTE = 60_000;
const APP_SLOTS = 6;

function formatMSS(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** 타이머가 끝나거나 멈췄을 때: 홈으로 */
function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function TimerScreen() {
  const params = useLocalSearchParams<{ minutes?: string }>();
  const session = useUsage((s) => s.session);
  const startSession = useUsage((s) => s.startSession);
  const stopSession = useUsage((s) => s.stopSession);
  const finishSession = useUsage((s) => s.finishSession);

  const [now, setNow] = useState(() => Date.now());
  const ended = useRef(false);

  // 열쇠는 남은 시간에 비례해 반시계로 풀린다(1분 = 1바퀴), 눈금자는 남은 비율
  const rotation = useSharedValue(0);
  const ratio = useSharedValue(1);

  // 진입: 진행 중인 세션이 없으면 파라미터로 시작
  useEffect(() => {
    const s = useUsage.getState().session;
    if (s && s.endsAt > Date.now()) return;
    const n = Number(params.minutes);
    if (n > 0) {
      startSession(n);
      const started = useUsage.getState().session;
      // 실제 앱 해제 + N분 뒤 익스텐션이 다시 잠그도록 스케줄
      if (started) ScreenTime.unlockFor(started.minutes).catch((e) => console.warn('[screen-time] unlockFor', e));
    } else leave();
  }, [params.minutes, startSession]);

  /** 남은 시간에 맞춰 열쇠·눈금자 애니메이션을 다시 건다 (진입·포그라운드 복귀) */
  const sync = useCallback(() => {
    const s = useUsage.getState().session;
    if (!s) return;
    const left = remainingMs(useUsage.getState(), Date.now());
    cancelAnimation(rotation);
    cancelAnimation(ratio);
    rotation.value = (left / MINUTE) * Math.PI * 2;
    ratio.value = left / (s.minutes * MINUTE);
    rotation.value = withTiming(0, { duration: left, easing: Easing.linear });
    ratio.value = withTiming(0, { duration: left, easing: Easing.linear });
    setNow(Date.now());
  }, [rotation, ratio]);

  useEffect(() => {
    if (session) sync();
  }, [session, sync]);

  // 표시는 1초마다, 값은 매번 endsAt - now 로 다시 계산 (누적 방식 금지)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') sync();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [sync]);

  // 안드로이드 뒤로가기 막기 (iOS 스와이프는 _layout 에서 막음)
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const left = session ? Math.max(session.endsAt - now, 0) : 0;

  // 0이 되면 종료
  useEffect(() => {
    if (!session || ended.current) return;
    if (left <= 0) {
      ended.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      finishSession();
      ScreenTime.lockNow(); // 익스텐션이 늦을 때를 대비해 한 번 더
      leave();
    }
  }, [left, session, finishSession]);

  const onStop = () => {
    if (ended.current) return;
    ended.current = true;
    cancelAnimation(rotation);
    cancelAnimation(ratio);
    stopSession();
    ScreenTime.lockNow();
    leave();
  };

  const selection = useLock((s) => s.selection);
  const appCount = useLock((s) => s.count);

  const totalMin = session?.minutes ?? (Number(params.minutes) || 0);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <Animated.View entering={keyAppear()} style={styles.keyArea}>
        <KeyCanvas rotation={rotation} widthRatio={0.3} background="#000000" />
      </Animated.View>

      <Animated.View entering={rise(1)} style={styles.timeBlock}>
        <Text style={styles.time}>{session ? formatMSS(left) : `${totalMin}:00`}</Text>
        <Text style={styles.remaining}>열려 있는 시간</Text>
      </Animated.View>

      <Animated.View entering={rise(2)} style={styles.ruler}>
        <TimeRuler ratio={ratio} totalLabel={`${totalMin}:00`} revealDelay={320} />
      </Animated.View>

      <Animated.View entering={rise(3)} style={styles.apps}>
        <Text style={styles.appsLabel}>Unlocked apps</Text>
        {appCount > 0 ? (
          <Animated.View entering={ZoomIn.delay(420).springify().damping(14)}>
            <ScreenTime.AppIcons selection={selection} maxCount={APP_SLOTS} iconSize={36} spacing={14} style={styles.appIcons} />
          </Animated.View>
        ) : (
          <View style={styles.appRow}>
            {Array.from({ length: APP_SLOTS }, (_, i) => (
              // 잠글 앱을 아직 고르지 않았을 때
              <Animated.View
                key={i}
                entering={ZoomIn.delay(420 + i * 50).springify().damping(14)}
                style={styles.appSlot}
              />
            ))}
          </View>
        )}
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.Text entering={rise(5)} style={styles.caption}>
        시간이 되면 자동으로 다시 잠깁니다.{'\n'}중간에 잠그면 남은 시간은 오늘 잔여로 돌아갑니다.
      </Animated.Text>

      <Animated.View entering={rise(6)} style={styles.actions}>
        <PressableScale onPress={onStop} style={styles.stopButton}>
          <Text style={styles.stopText}>지금 잠그기</Text>
        </PressableScale>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  keyArea: { height: '24%', marginTop: 8 },
  timeBlock: { alignItems: 'center', marginTop: 8 },
  time: { fontSize: 88, fontWeight: '200', color: '#fff', fontVariant: ['tabular-nums'], letterSpacing: -1 },
  remaining: { fontSize: 12, color: '#888', marginTop: -2 },
  ruler: { marginTop: 28, paddingHorizontal: 24 },
  apps: { marginTop: 32, paddingHorizontal: 24 },
  appsLabel: { fontSize: 12, color: '#aaa', marginBottom: 12 },
  appRow: { flexDirection: 'row', gap: 14 },
  appIcons: { height: 40 },
  appSlot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#333',
  },
  spacer: { flex: 1 },
  caption: { textAlign: 'center', fontSize: 12, lineHeight: 18, color: '#777', marginBottom: 16 },
  actions: { paddingHorizontal: 24, paddingBottom: 12 },
  stopButton: { height: 54, borderRadius: 27, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  stopText: { fontSize: 16, fontWeight: '600', color: '#000' },
});
