export const TWO_PI = Math.PI * 2;
export const DEAD_ZONE = 40; // 중심 근처는 각도가 불안정해서 무시 (pt)
/**
 * 손가락 회전각 → 열쇠 회전각 배율.
 * 열쇠는 1바퀴 = 1분 그대로, 손가락은 360° / WIND_GAIN 만 그리면 1분이 감긴다.
 * 3 이면 손가락 120°(한 번 쓸어내리는 정도) ≈ 1분.
 */
export const WIND_GAIN = 3;
/** 가벼운 햅틱 간격. 손가락 30° 마다 (열쇠 각도로는 30° × WIND_GAIN) */
export const TICK = (Math.PI / 6) * WIND_GAIN;

/** 누적 회전량 → 분. 30·2π / 2π 가 29.999… 로 떨어지는 부동소수점 오차 보정 */
export function minutesOf(total: number) {
  'worklet';
  return Math.floor(total / TWO_PI + 1e-9);
}

export type WindState = {
  prevAngle: number;
  total: number;
};

/** Pan onBegin: 기준각 설정 */
export function windBegin(x: number, y: number, cx: number, cy: number) {
  'worklet';
  return Math.atan2(y - cy, x - cx);
}

/**
 * Pan onUpdate 한 번 분량의 계산.
 * - Δθ 를 (-π, π] 로 정규화
 * - 화면 좌표(y 아래로 증가)에서 Δθ > 0 이 시계 방향 → 그것만 WIND_GAIN 배 해서 누적(래칫)
 * - 중심 DEAD_ZONE 이내는 기준각만 갱신
 * 반환값은 새 상태. 원본은 건드리지 않는다.
 */
export function windStep(
  s: WindState,
  x: number,
  y: number,
  cx: number,
  cy: number,
  maxTotal: number,
): WindState {
  'worklet';
  const dx = x - cx;
  const dy = y - cy;
  const angle = Math.atan2(dy, dx);

  if (dx * dx + dy * dy < DEAD_ZONE * DEAD_ZONE) {
    return { prevAngle: angle, total: s.total };
  }

  let delta = angle - s.prevAngle;
  if (delta > Math.PI) delta -= TWO_PI;
  else if (delta <= -Math.PI) delta += TWO_PI;

  const total = delta > 0 ? Math.min(s.total + delta * WIND_GAIN, maxTotal) : s.total;
  return { prevAngle: angle, total };
}
