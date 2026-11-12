import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import KeyCanvas from '../../components/KeyCanvas';
import { keyAppear, rise } from '../../components/motion';
import PressableScale from '../../components/PressableScale';
import RollingNumber from '../../components/RollingNumber';
import StatusChip from '../../components/StatusChip';
import WindGauge from '../../components/WindGauge';
import { useUsage } from '../../stores/usage';

const NUMBER_SIZE = 72;
const NUMBER_LINE = 84;

export default function HomeScreen() {
  const todayUnlockedMin = useUsage((s) => s.todayUnlockedMin);
  const dailyCapMin = useUsage((s) => s.dailyCapMin);
  const session = useUsage((s) => s.session);

  // 열쇠는 비스듬히 놓인 채 천천히 좌우로 흔들린다
  const sway = useSharedValue(0);
  useEffect(() => {
    sway.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(0.55, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
          withTiming(-0.25, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [sway]);

  // 게이지: 오늘 푼 시간 / 하루 상한. 값이 바뀌면 스프링으로 따라간다
  const progress = useSharedValue(0);
  useEffect(() => {
    const p = dailyCapMin > 0 ? todayUnlockedMin / dailyCapMin : 0;
    progress.value = withDelay(350, withSpring(p, { damping: 20, stiffness: 90 }));
  }, [todayUnlockedMin, dailyCapMin, progress]);

  const active = !!session && session.endsAt > Date.now();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Animated.View entering={rise(0)} style={styles.header}>
        <StatusChip />
      </Animated.View>

      <View style={styles.keyArea}>
        <Animated.View entering={keyAppear()} style={StyleSheet.absoluteFill}>
          <KeyCanvas rotation={sway} widthRatio={0.5} tilt={Math.PI / 6} />
        </Animated.View>
        <WindGauge progress={progress} radius={150} revealDelay={200} />
      </View>

      <Animated.Text entering={rise(2)} style={styles.label}>
        오늘 푼 시간
      </Animated.Text>
      <Animated.View entering={rise(3)} style={styles.numberRow}>
        <RollingNumber value={todayUnlockedMin} style={styles.number} lineHeight={NUMBER_LINE} />
        <Text style={styles.unit}>min</Text>
      </Animated.View>
      <Animated.Text entering={rise(4)} style={styles.caption}>
        &apos;사용&apos;을 누르고 쓸 만큼 태엽을 감으세요.
      </Animated.Text>

      <View style={styles.spacer} />

      <Animated.View entering={rise(5)} style={styles.actions}>
        <PressableScale
          onPress={() => router.push(active ? '/timer' : '/wind')}
          style={styles.useButton}
        >
          <Text style={styles.useText}>{active ? '사용 중' : '사용'}</Text>
        </PressableScale>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { paddingHorizontal: 24, paddingTop: 8 },
  keyArea: { height: '46%' },
  label: { textAlign: 'center', fontSize: 13, color: '#888', marginTop: 4 },
  numberRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end' },
  number: { fontSize: NUMBER_SIZE, fontWeight: '200', color: '#111', fontVariant: ['tabular-nums'] },
  unit: { fontSize: 15, color: '#666', marginLeft: 4, marginBottom: 14 },
  caption: { marginTop: 8, textAlign: 'center', fontSize: 13, lineHeight: 19, color: '#999' },
  spacer: { flex: 1 },
  actions: { paddingHorizontal: 24, paddingBottom: 16 },
  useButton: { height: 54, borderRadius: 27, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  useText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
