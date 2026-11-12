import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';

const DURATION = 180;
const SHIFT = 0.6; // 글자 높이 대비 이동 거리

type Props = {
  value: number | string;
  style: TextStyle;
  /** 줄 높이(px). 이동 거리 계산과 클리핑에 쓴다 */
  lineHeight: number;
};

/** 값이 바뀌면 이전 값은 위로 빠지고 새 값이 아래에서 밀려 올라온다 */
export default function RollingNumber({ value, style, lineHeight }: Props) {
  const d = lineHeight * SHIFT;
  const entering = new Keyframe({
    0: { opacity: 0, transform: [{ translateY: d }] },
    100: { opacity: 1, transform: [{ translateY: 0 }], easing: Easing.out(Easing.cubic) },
  }).duration(DURATION);
  const exiting = new Keyframe({
    0: { opacity: 1, transform: [{ translateY: 0 }] },
    100: { opacity: 0, transform: [{ translateY: -d }], easing: Easing.in(Easing.cubic) },
  }).duration(DURATION);

  return (
    <View style={[styles.clip, { height: lineHeight }]}>
      {/* 폭 맞추기용 (보이지 않음) */}
      <Text style={[style, { lineHeight }, styles.hidden]}>{value}</Text>
      <Animated.Text
        key={value}
        entering={entering}
        exiting={exiting}
        style={[style, { lineHeight }, styles.abs]}
      >
        {value}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  hidden: { opacity: 0 },
  abs: { position: 'absolute', left: 0, top: 0 },
});
