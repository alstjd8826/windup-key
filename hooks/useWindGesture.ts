import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { cancelAnimation, Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { minutesOf, TICK, TWO_PI, windBegin, windStep } from './windMath';

export const MAX_MINUTES = 30;

function hapticTick() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
function hapticTurn() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
function hapticMax() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/**
 * 열쇠 중심을 기준으로 원을 그리며 감는 제스처.
 * 시계 방향 회전만 누적(래칫), 1바퀴 = 1분. 손을 떼면 관성 없이 바로 멈춘다.
 *
 * @param maxMinutes 감을 수 있는 최대 분 (기본 30)
 */
export function useWindGesture(maxMinutes = MAX_MINUTES) {
  const cx = useSharedValue(0);
  const cy = useSharedValue(0);
  const prevAngle = useSharedValue(0);
  /** 누적 회전량(rad). 열쇠 Y축 회전에 그대로 쓴다 */
  const total = useSharedValue(0);
  const lastTick = useSharedValue(0);
  const lastMinutes = useSharedValue(0);
  const maxHit = useSharedValue(false);
  const maxTotal = useSharedValue(maxMinutes * TWO_PI);
  useEffect(() => {
    maxTotal.value = maxMinutes * TWO_PI;
  }, [maxMinutes, maxTotal]);

  // 화면 표시용. 매 프레임이 아니라 분이 바뀔 때만 갱신된다
  const [minutes, setMinutes] = useState(0);

  /** 열쇠가 그려지는 영역의 onLayout. 제스처 레이어와 같은 부모 좌표계여야 한다 */
  const onKeyLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { x, y, width, height } = e.nativeEvent.layout;
      cx.value = x + width / 2;
      cy.value = y + height / 2;
    },
    [cx, cy],
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => {
          cancelAnimation(total); // 되감기 애니메이션 중이면 그 자리에서 이어 감는다
          prevAngle.value = windBegin(e.x, e.y, cx.value, cy.value);
        })
        .onUpdate((e) => {
          const next = windStep(
            { prevAngle: prevAngle.value, total: total.value },
            e.x,
            e.y,
            cx.value,
            cy.value,
            maxTotal.value,
          );
          prevAngle.value = next.prevAngle;
          if (next.total === total.value || maxHit.value) return;
          total.value = next.total;

          const m = minutesOf(next.total);
          const tick = Math.floor(next.total / TICK + 1e-9);
          const minuteChanged = m !== lastMinutes.value;
          if (minuteChanged) {
            lastMinutes.value = m;
            scheduleOnRN(setMinutes, m);
          }

          if (next.total >= maxTotal.value) {
            maxHit.value = true;
            lastTick.value = tick;
            scheduleOnRN(hapticMax);
          } else if (minuteChanged) {
            lastTick.value = tick;
            scheduleOnRN(hapticTurn);
          } else if (tick !== lastTick.value) {
            lastTick.value = tick;
            scheduleOnRN(hapticTick);
          }
        }),
    [cx, cy, prevAngle, total, lastTick, lastMinutes, maxHit, maxTotal],
  );

  /** animate: 열쇠와 게이지가 거꾸로 풀리며 0으로 돌아간다 */
  const reset = useCallback((animate = false) => {
    total.value = animate
      ? withTiming(0, { duration: 520, easing: Easing.bezier(0.4, 0, 0.2, 1) })
      : 0;
    lastTick.value = 0;
    lastMinutes.value = 0;
    maxHit.value = false;
    setMinutes(0);
  }, [total, lastTick, lastMinutes, maxHit]);

  return { gesture, total, minutes, reset, onKeyLayout };
}
