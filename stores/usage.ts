import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import * as L from './usageLogic';

export type { Session } from './usageLogic';
export { remainingMs, todayLeftMin } from './usageLogic';

type Actions = {
  /** 날짜가 바뀌었으면 todayUnlockedMin 을 0으로 */
  rollover: () => void;
  /** 이미 끝난 세션 정리 + 날짜 갱신. 앱 시작 시 */
  restore: () => void;
  startSession: (minutes: number) => void;
  stopSession: () => void;
  finishSession: () => void;
};

export const useUsage = create<L.UsageData & Actions>()(
  persist(
    (set, get) => {
      const apply = (fn: (s: L.UsageData) => L.UsageData) => set(fn(get()));
      return {
        dailyCapMin: 60,
        todayUnlockedMin: 0,
        lastResetDate: L.localDate(Date.now()),
        session: null,
        rollover: () => apply((s) => L.rollover(s, Date.now())),
        restore: () => apply((s) => L.restore(s, Date.now())),
        startSession: (m) => apply((s) => L.start(L.rollover(s, Date.now()), m, Date.now())),
        stopSession: () => apply((s) => L.stop(s, Date.now())),
        finishSession: () => apply(L.finish),
      };
    },
    {
      name: 'usage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ dailyCapMin, todayUnlockedMin, lastResetDate, session }) => ({
        dailyCapMin,
        todayUnlockedMin,
        lastResetDate,
        session,
      }),
    },
  ),
);

/** 파생값 훅 */
export const useTodayLeftMin = () => useUsage((s) => L.todayLeftMin(s));
