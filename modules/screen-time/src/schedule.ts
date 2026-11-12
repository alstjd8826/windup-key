/**
 * DeviceActivitySchedule 은 길이가 15분 미만이면 startMonitoring 이 intervalTooShort 로 실패한다.
 * 이 앱은 1~30분이라 시작을 과거로 당겨 길이를 15분 이상으로 맞춘다.
 *   intervalStart = now - max(15 - N, 0)분, intervalEnd = now + N분
 * 끝나는 시각(= 다시 잠기는 시각)은 그대로 now + N분.
 */
export const MIN_INTERVAL_MIN = 15;
const MINUTE = 60_000;

export type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

/** DateComponents 는 날짜까지 채워야 자정을 넘는 구간이 꼬이지 않는다 */
export function toDateParts(t: number): DateParts {
  const d = new Date(t);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
    second: d.getSeconds(),
  };
}

export function unlockWindow(minutes: number, now: number) {
  const n = Math.max(Math.floor(minutes), 1);
  const startAt = now - Math.max(MIN_INTERVAL_MIN - n, 0) * MINUTE;
  const endAt = now + n * MINUTE;
  return {
    startAt,
    endAt,
    schedule: {
      intervalStart: toDateParts(startAt),
      intervalEnd: toDateParts(endAt),
      repeats: false,
    },
  };
}
