import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import KeyCanvas from '../components/KeyCanvas';
import { keyAppear, rise } from '../components/motion';
import PressableScale from '../components/PressableScale';
import RollingNumber from '../components/RollingNumber';
import WindGauge from '../components/WindGauge';
import { MAX_MINUTES, useWindGesture } from '../hooks/useWindGesture';
import { useTodayLeftMin } from '../stores/usage';
import { TWO_PI } from '../hooks/windMath';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const NUMBER_SIZE = 72;
const NUMBER_LINE = 84;
const BUTTON_LINE = 22;

export default function WindScreen() {
  const todayLeft = useTodayLeftMin();
  const maxMinutes = Math.min(MAX_MINUTES, todayLeft);
  const exhausted = maxMinutes === 0;
  const { gesture, total, minutes, reset, onKeyLayout } = useWindGesture(maxMinutes);
  const enabled = minutes > 0;

  // 게이지: 현재 바퀴 진행률. 최대치에 도달하면 꽉 찬 채로
  const maxTotal = maxMinutes * TWO_PI;
  const progress = useDerivedValue(() =>
    total.value >= maxTotal ? 1 : (total.value % TWO_PI) / TWO_PI,
  );

  // 버튼 비활성 ↔ 활성 색 전환
  const active = useSharedValue(0);
  useEffect(() => {
    active.value = withTiming(enabled ? 1 : 0, { duration: 240 });
  }, [enabled, active]);
  const buttonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(active.value, [0, 1], ['#E6E6E6', '#111111']),
  }));
  const buttonTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(active.value, [0, 1], ['#AAAAAA', '#FFFFFF']),
  }));

  // 최대치 도달 시 숫자가 한 번 튕긴다
  const pop = useSharedValue(1);
  useEffect(() => {
    if (maxMinutes > 0 && minutes === maxMinutes) {
      pop.value = withSequence(withTiming(1.08, { duration: 120 }), withSpring(1, { damping: 8 }));
    }
  }, [minutes, maxMinutes, pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  // 디버그: 누적 각도를 리렌더 없이 표시
  const degProps = useAnimatedProps(() => {
    const text = `${Math.round((total.value * 180) / Math.PI)}°`;
    return { text, defaultValue: text } as object;
  });

  const onUse = () => {
    // 감기 화면을 타이머로 교체 → 타이머가 끝나면 홈으로 돌아간다
    router.replace({ pathname: '/timer', params: { minutes: String(minutes) } });
  };

  const onQuit = () => {
    reset(true); // 열쇠를 되감으며 리셋
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Animated.Text entering={rise(0)} style={styles.title}>
        사용 시간
      </Animated.Text>

      <View style={styles.keyArea} onLayout={onKeyLayout}>
        <Animated.View entering={keyAppear()} style={StyleSheet.absoluteFill}>
          <KeyCanvas rotation={total} widthRatio={0.45} />
        </Animated.View>
        <WindGauge progress={progress} revealDelay={250} />
      </View>

      <Animated.View entering={rise(3)}>
        <Animated.View style={[styles.numberRow, popStyle]}>
          <Text style={styles.plus}>+</Text>
          <RollingNumber value={minutes} style={styles.number} lineHeight={NUMBER_LINE} />
          <Text style={styles.unit}>min</Text>
        </Animated.View>
      </Animated.View>

      <Animated.Text entering={rise(4)} style={styles.caption}>
        {exhausted
          ? '오늘 한도를 다 썼습니다\n내일 다시 감을 수 있어요'
          : '1바퀴에 1분\n1분이 안 되는 나머지는 버려집니다'}
      </Animated.Text>

      {/* 열쇠·숫자 영역 위에 덮는 투명 제스처 레이어 (Canvas 자체 터치는 쓰지 않음).
          버튼보다 먼저 그려서 버튼 터치는 버튼이 받는다 */}
      <GestureDetector gesture={gesture}>
        <View
          style={StyleSheet.absoluteFill}
          collapsable={false}
          pointerEvents={exhausted ? 'none' : 'auto'}
        />
      </GestureDetector>

      <View style={styles.spacer} pointerEvents="none" />

      <Animated.View entering={rise(5)} style={styles.actions}>
        <PressableScale disabled={!enabled} onPress={onUse} style={styles.useWrap}>
          <Animated.View style={[styles.useButton, buttonStyle]}>
            <Animated.Text style={[styles.useText, buttonTextStyle]}>
              {enabled ? '' : '사용'}
            </Animated.Text>
            {enabled && (
              <Animated.View entering={FadeIn.duration(180)} style={styles.useLabel}>
                <RollingNumber value={minutes} style={styles.useTextOn} lineHeight={BUTTON_LINE} />
                <Text style={styles.useTextOn}>분 사용</Text>
              </Animated.View>
            )}
          </Animated.View>
        </PressableScale>
        <PressableScale onPress={onQuit} hitSlop={12} scaleTo={0.92}>
          <Text style={styles.quit}>그만두기</Text>
        </PressableScale>
      </Animated.View>

      {__DEV__ && (
        <View style={styles.debug} pointerEvents="none">
          <AnimatedTextInput editable={false} style={styles.debugText} animatedProps={degProps} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  title: { marginTop: 8, marginLeft: 24, fontSize: 13, color: '#666' },
  keyArea: { height: '45%' },
  numberRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginTop: 8 },
  plus: { fontSize: NUMBER_SIZE, lineHeight: NUMBER_LINE, fontWeight: '200', color: '#111' },
  number: { fontSize: NUMBER_SIZE, fontWeight: '200', color: '#111', fontVariant: ['tabular-nums'] },
  unit: { fontSize: 15, color: '#666', marginLeft: 4, marginBottom: 14 },
  caption: { marginTop: 12, textAlign: 'center', fontSize: 13, lineHeight: 19, color: '#999' },
  spacer: { flex: 1 },
  actions: { paddingHorizontal: 24, paddingBottom: 12, gap: 16, alignItems: 'center' },
  useWrap: { alignSelf: 'stretch' },
  useButton: { height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  useText: { fontSize: 16, fontWeight: '600', position: 'absolute' },
  useLabel: { flexDirection: 'row', alignItems: 'center' },
  useTextOn: { fontSize: 16, lineHeight: BUTTON_LINE, fontWeight: '600', color: '#fff', fontVariant: ['tabular-nums'] },
  quit: { fontSize: 14, color: '#666', paddingVertical: 4 },
  debug: { position: 'absolute', top: 60, right: 16 },
  debugText: { fontSize: 11, color: '#bbb', fontVariant: ['tabular-nums'], padding: 0 },
});
