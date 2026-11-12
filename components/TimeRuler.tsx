import { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

const AnimatedLine = Animated.createAnimatedComponent(Line);

const TICKS = 61;
const H = 18;
const SHORT = 7;
const LONG = 14;
const FEATHER = 4;

type Tick = { i: number; x: number; long: boolean };

type Props = {
  /** 남은 비율 0~1. 왼쪽부터 이 비율만큼 흰색 */
  ratio: SharedValue<number>;
  /** 오른쪽 라벨 (예: "5:00") */
  totalLabel: string;
  revealDelay?: number;
};

const RulerTick = memo(function RulerTick({
  t,
  ratio,
  reveal,
}: {
  t: Tick;
  ratio: SharedValue<number>;
  reveal: SharedValue<number>;
}) {
  const y1 = H - (t.long ? LONG : SHORT);
  // 진입: 왼쪽에서 오른쪽으로 눈금이 켜진다
  const baseProps = useAnimatedProps(() => {
    const head = reveal.value * (TICKS + FEATHER);
    return { opacity: Math.min(Math.max((head - t.i) / FEATHER, 0), 1) };
  });
  // 남은 비율만큼 흰 눈금
  const litProps = useAnimatedProps(() => {
    const head = reveal.value * (TICKS + FEATHER);
    const shown = Math.min(Math.max((head - t.i) / FEATHER, 0), 1);
    const edge = ratio.value * (TICKS - 1);
    const lit = Math.min(Math.max(edge - t.i + 1, 0), 1);
    return { opacity: shown * lit };
  });
  return (
    <>
      <AnimatedLine x1={t.x} y1={y1} x2={t.x} y2={H} stroke="#444" strokeWidth={1} animatedProps={baseProps} />
      <AnimatedLine x1={t.x} y1={y1} x2={t.x} y2={H} stroke="#FFF" strokeWidth={1} animatedProps={litProps} />
    </>
  );
});

/** 타이머 화면의 가로 눈금자. 남은 시간 비율만큼 왼쪽부터 흰색 */
export default function TimeRuler({ ratio, totalLabel, revealDelay = 300 }: Props) {
  const [w, setW] = useState(0);
  const reveal = useSharedValue(0);

  useEffect(() => {
    if (!w) return;
    reveal.value = withDelay(revealDelay, withTiming(1, { duration: 800, easing: Easing.bezier(0.3, 0.7, 0.2, 1) }));
  }, [w, reveal, revealDelay]);

  const ticks = useMemo<Tick[]>(
    () =>
      w
        ? Array.from({ length: TICKS }, (_, i) => ({
            i,
            x: 0.5 + (i / (TICKS - 1)) * (w - 1),
            long: i % 5 === 0,
          }))
        : [],
    [w],
  );

  return (
    <View>
      <View style={{ height: H }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {w > 0 && (
          <Svg width={w} height={H}>
            {ticks.map((t) => (
              <RulerTick key={t.i} t={t} ratio={ratio} reveal={reveal} />
            ))}
          </Svg>
        )}
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>0</Text>
        <Text style={styles.label}>{totalLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  label: { fontSize: 11, color: '#777', fontVariant: ['tabular-nums'] },
});
