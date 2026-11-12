import { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Line, Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLine = Animated.createAnimatedComponent(Line);

const TICKS = 60;
const SHORT = 6;
const LONG = 12;
/** 눈금이 한 개씩 켜지며 번지는 폭(눈금 개수 단위) */
const FEATHER = 6;

type Props = {
  /** 채울 비율 0~1 */
  progress: SharedValue<number>;
  radius?: number;
  /** 진입 시 눈금이 위에서 아래로 쓸리며 나타나기 시작하는 시점(ms) */
  revealDelay?: number;
};

type Tick = { i: number; x1: number; y1: number; x2: number; y2: number; long: boolean };

const TickLine = memo(function TickLine({ t, reveal }: { t: Tick; reveal: SharedValue<number> }) {
  const props = useAnimatedProps(() => {
    const head = reveal.value * (TICKS + FEATHER);
    const o = Math.min(Math.max((head - t.i) / FEATHER, 0), 1);
    return { opacity: o };
  });
  return (
    <AnimatedLine
      x1={t.x1}
      y1={t.y1}
      x2={t.x2}
      y2={t.y2}
      stroke="#CFCFCF"
      strokeWidth={t.long ? 1.5 : 1}
      strokeLinecap="round"
      animatedProps={props}
    />
  );
});

/**
 * 열쇠 오른쪽 반원 게이지 (위 -90° → 아래 +90°). progress 만큼 진한 선으로 채운다.
 * 부모(열쇠 영역)를 꽉 채우고, 중심은 부모 중앙 = 열쇠 중심.
 */
export default function WindGauge({ progress, radius = 140, revealDelay = 250 }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const cx = size.w / 2;
  const cy = size.h / 2;
  const arcR = radius + 4;
  const arcLen = Math.PI * arcR;

  const reveal = useSharedValue(0);
  useEffect(() => {
    if (!size.w) return;
    reveal.value = withDelay(
      revealDelay,
      withTiming(1, { duration: 900, easing: Easing.bezier(0.3, 0.7, 0.2, 1) }),
    );
  }, [size.w, reveal, revealDelay]);

  const ticks = useMemo<Tick[]>(() => {
    if (!size.w) return [];
    return Array.from({ length: TICKS }, (_, i) => {
      const a = -Math.PI / 2 + (i / (TICKS - 1)) * Math.PI;
      const len = i % 5 === 0 ? LONG : SHORT;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      return {
        i,
        x1: cx + radius * cos,
        y1: cy + radius * sin,
        x2: cx + (radius - len) * cos,
        y2: cy + (radius - len) * sin,
        long: i % 5 === 0,
      };
    });
  }, [size.w, cx, cy, radius]);

  const progressProps = useAnimatedProps(() => {
    const p = Math.min(Math.max(progress.value, 0), 1);
    return { strokeDashoffset: arcLen * (1 - p), opacity: p > 0.002 ? 1 : 0 };
  });

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size.w > 0 && (
        <Svg width={size.w} height={size.h}>
          {ticks.map((t) => (
            <TickLine key={t.i} t={t} reveal={reveal} />
          ))}
          <AnimatedPath
            d={`M ${cx} ${cy - arcR} A ${arcR} ${arcR} 0 0 1 ${cx} ${cy + arcR}`}
            stroke="#111"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${arcLen} ${arcLen}`}
            animatedProps={progressProps}
          />
        </Svg>
      )}
    </View>
  );
}
