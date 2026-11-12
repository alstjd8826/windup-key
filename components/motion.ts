import { Easing, FadeInDown, Keyframe } from 'react-native-reanimated';

/** 화면 진입 시 요소들이 순서대로 올라오는 간격 */
export const STAGGER = 70;

/** 위로 살짝 떠오르며 나타나기 (스프링) */
export function rise(order: number) {
  return FadeInDown.delay(120 + order * STAGGER)
    .springify()
    .damping(18)
    .stiffness(160)
    .withInitialValues({ opacity: 0, transform: [{ translateY: 14 }] });
}

/** 열쇠: 약간 작게 시작해서 커지며 나타나기 */
export function keyAppear() {
  return new Keyframe({
    0: { opacity: 0, transform: [{ scale: 0.9 }, { translateY: 10 }] },
    100: {
      opacity: 1,
      transform: [{ scale: 1 }, { translateY: 0 }],
      easing: Easing.bezier(0.2, 0.9, 0.2, 1),
    },
  })
    .delay(60)
    .duration(650);
}

export const SPRING_PRESS = { damping: 15, stiffness: 400, mass: 0.6 };
