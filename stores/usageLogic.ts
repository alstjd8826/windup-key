/** 상태 계산 규칙. React·저장소와 무관한 순수 함수라 따로 테스트한다 */

export type Session = { endsAt: number; minutes: number };

export type UsageData = {
  /** 하루 상한(분) */
  dailyCapMin: number;
  /** 오늘 푼 시간. 타이머 시작 시 +N, 멈추기 시 안 쓴 분만큼 - */
  todayUnlockedMin: number;
  /** YYYY-MM-DD (기기 로컬) */
  lastResetDate: string;
  /** 진행 중인 타이머 */
  session: Session | null;
};

const MINUTE = 60_000;

export function localDate(now: number) {
  const d = new Date(now);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 파생값: 오늘 남은 한도 (저장하지 않는다) */
export function todayLeftMin(s: Pick<UsageData, 'dailyCapMin' | 'todayUnlockedMin'>) {
  return Math.max(s.dailyCapMin - s.todayUnlockedMin, 0);
}

/** 앱 진입·포그라운드 복귀 때: 날짜가 바뀌었으면 오늘 푼 시간을 0으로 */
export function rollover(s: UsageData, now: number): UsageData {
  const today = localDate(now);
  if (s.lastResetDate === today) return s;
  return { ...s, todayUnlockedMin: 0, lastResetDate: today };
}

/** 타이머 시작. 남은 한도보다 많이 요청하면 한도까지만 */
export function start(s: UsageData, minutes: number, now: number): UsageData {
  const n = Math.min(Math.max(Math.floor(minutes), 0), todayLeftMin(s));
  if (n <= 0) return s;
  return {
    ...s,
    todayUnlockedMin: s.todayUnlockedMin + n,
    session: { endsAt: now + n * MINUTE, minutes: n },
  };
}

/** 남은 시간(ms). 세션이 없으면 0 */
export function remainingMs(s: Pick<UsageData, 'session'>, now: number) {
  return s.session ? Math.max(s.session.endsAt - now, 0) : 0;
}

/** 멈추기: 안 쓴 시간을 분 단위로 내림한 만큼 오늘 한도로 돌려준다 */
export function stop(s: UsageData, now: number): UsageData {
  if (!s.session) return s;
  const refund = Math.floor(remainingMs(s, now) / MINUTE);
  return {
    ...s,
    todayUnlockedMin: Math.max(s.todayUnlockedMin - refund, 0),
    session: null,
  };
}

/** 시간이 다 됐을 때: 반환 없이 세션만 정리 */
export function finish(s: UsageData): UsageData {
  return s.session ? { ...s, session: null } : s;
}

/** 앱을 다시 켰을 때: 이미 지난 세션은 정리 */
export function restore(s: UsageData, now: number): UsageData {
  const r = rollover(s, now);
  if (r.session && r.session.endsAt <= now) return finish(r);
  return r;
}
