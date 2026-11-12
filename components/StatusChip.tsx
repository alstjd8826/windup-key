import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useUsage } from '../stores/usage';

function formatMSS(ms: number) {
  const t = Math.ceil(ms / 1000);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

/** 홈 상단 상태 칩: "● 잠김" / "● 사용 중 M:SS" (사용 중엔 점이 숨 쉬듯 깜빡) */
export default function StatusChip() {
  const session = useUsage((s) => s.session);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!session) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = session
      ? withRepeat(withSequence(withTiming(0.3, { duration: 700 }), withTiming(1, { duration: 700 })), -1)
      : withTiming(1);
  }, [session, pulse]);
  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const active = session && session.endsAt > now;
  const label = active ? `사용 중 ${formatMSS(session.endsAt - now)}` : '잠김';

  return (
    <View style={styles.chip}>
      <Animated.View style={[styles.dot, { backgroundColor: active ? '#2BB673' : '#111' }, dotStyle]} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#ECECEC',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, color: '#444', fontVariant: ['tabular-nums'] },
});
