import { create } from 'zustand';

import * as ScreenTime from '../modules/screen-time';

/**
 * 잠금 상태 미러. 원본은 App Group(UserDefaults)과 ManagedSettings 에 있고,
 * 여기는 화면 표시용으로 읽어 온 값만 들고 있다(저장하지 않음).
 */
type LockState = {
  available: boolean;
  auth: ScreenTime.AuthStatus;
  selection: string | null;
  count: number;
  refresh: () => void;
};

function read() {
  const available = ScreenTime.isAvailable();
  if (!available) return { available, auth: 'notDetermined' as const, selection: null, count: 0 };
  return {
    available,
    auth: ScreenTime.getAuthorizationStatus(),
    selection: ScreenTime.getSelection(),
    count: ScreenTime.getSelectedAppsCount(),
  };
}

export const useLock = create<LockState>()((set) => ({
  ...read(),
  refresh: () => {
    const next = read();
    set(next);
    // 실기기 검증용: 잠김 여부와 익스텐션이 기록한 해제 구간 이벤트
    if (__DEV__ && next.available) {
      console.log('[screen-time]', JSON.stringify({ auth: next.auth, count: next.count, locked: ScreenTime.isLocked(), events: ScreenTime.getUnlockEvents(), ...ScreenTime.debugInfo() }));
    }
  },
}));
