/**
 * 앱 잠금(Screen Time) JS API.
 * 실제 차단·스케줄·익스텐션은 react-native-device-activity 가 하고,
 * 여기서는 이 앱이 쓰는 형태로 감싸고 선택한 앱 아이콘 뷰를 더한다.
 *
 * ⚠️ 시뮬레이터에서는 동작하지 않는다(실기기 전용).
 */
import { requireNativeModule, requireNativeViewManager } from 'expo-modules-core';
import type { ViewProps } from 'react-native';
import * as DA from 'react-native-device-activity';

import { unlockWindow } from './src/schedule';

export { unlockWindow } from './src/schedule';

/** 잠글 앱 선택을 App Group 에 저장할 때 쓰는 키 */
export const SELECTION_ID = 'windup-locked-apps';
/** 해제 구간 모니터링 이름 */
const ACTIVITY = 'windup-unlock';
const SHIELD_ID = 'windup-shield';

const Native = requireNativeModule<{
  selectionCounts(selection: string): { applications: number; categories: number; webDomains: number };
}>('ScreenTime');

export function isAvailable() {
  return DA.isAvailable();
}

export type AuthStatus = 'notDetermined' | 'denied' | 'approved';

export function getAuthorizationStatus(): AuthStatus {
  const s = DA.getAuthorizationStatus();
  if (s === DA.AuthorizationStatus.approved) return 'approved';
  if (s === DA.AuthorizationStatus.denied) return 'denied';
  return 'notDetermined';
}

/** FamilyControls .individual 권한 요청. 결과는 바로 안 바뀔 수 있어 잠깐 폴링한다 */
export async function requestAuthorization(): Promise<AuthStatus> {
  await DA.requestAuthorization('individual');
  await DA.pollAuthorizationStatus({ pollIntervalMs: 300, maxAttempts: 10 });
  return getAuthorizationStatus();
}

export function getSelection(): string | null {
  return (DA.getFamilyActivitySelectionId(SELECTION_ID) as string | undefined) ?? null;
}

/** 선택한 앱 + 카테고리 개수 */
export function getSelectedAppsCount(): number {
  const sel = getSelection();
  if (!sel) return 0;
  const c = Native.selectionCounts(sel);
  return c.applications + c.categories;
}

/** 열쇠 이미지를 App Group 에 복사 (차단 화면 익스텐션은 App Group 파일만 읽을 수 있다) */
export function installShieldImage(localFileUri: string): string | undefined {
  const dir = DA.getAppGroupFileDirectory();
  if (!dir) return undefined;
  const name = 'shield-key.png';
  DA.copyFile(localFileUri, `${dir.replace(/\/$/, '')}/${name}`, true);
  return name;
}

/** 차단 화면(흰 배경, 열쇠 이미지, 안내 문구) */
export function configureShield(keyImageRelativePath?: string) {
  DA.updateShieldWithId(
    {
      title: '태엽을 감아야 열립니다',
      subtitle: '태엽 앱에서 쓸 만큼 감고 돌아오세요',
      primaryButtonLabel: '닫기',
      backgroundColor: { red: 255, green: 255, blue: 255 },
      titleColor: { red: 17, green: 17, blue: 17 },
      subtitleColor: { red: 120, green: 120, blue: 120 },
      primaryButtonBackgroundColor: { red: 17, green: 17, blue: 17 },
      primaryButtonLabelColor: { red: 255, green: 255, blue: 255 },
      ...(keyImageRelativePath
        ? { iconAppGroupRelativePath: keyImageRelativePath }
        : { iconSystemName: 'key.fill' }),
    },
    { primary: { behavior: 'close' } },
    SHIELD_ID,
  );
}

/** 선택 시트를 닫은 뒤: 타이머 중이 아니면 새 선택으로 바로 잠근다 */
export function applySelection({ unlocked }: { unlocked: boolean }) {
  if (!unlocked) lockNow();
}

/** 즉시 잠금 (멈추기·타이머 종료 시. 익스텐션 지연 대비로 한 번 더 불러도 안전) */
export function lockNow() {
  DA.stopMonitoring([ACTIVITY]);
  if (getSelection()) {
    DA.blockSelection({ activitySelectionId: SELECTION_ID }, 'lockNow');
  }
}

/**
 * N분 해제. 앱이 꺼져 있어도 다시 잠기도록, 재잠금은 DeviceActivityMonitor 익스텐션의
 * intervalDidEnd 에 맡긴다(JS 타이머에 의존하지 않음).
 */
export async function unlockFor(minutes: number, now = Date.now()) {
  if (!getSelection()) return;
  const { schedule } = unlockWindow(minutes, now);

  DA.configureActions({
    activityName: ACTIVITY,
    callbackName: 'intervalDidEnd',
    actions: [{ type: 'blockSelection', familyActivitySelectionId: SELECTION_ID, shieldId: SHIELD_ID }],
  });
  DA.stopMonitoring([ACTIVITY]); // 같은 이름의 기존 모니터링 제거
  DA.unblockSelection({ activitySelectionId: SELECTION_ID }, 'unlockFor');
  await DA.startMonitoring(ACTIVITY, schedule, []);
}

export function isLocked(): boolean {
  return DA.isShieldActive();
}

/** 실기기 디버그: 선택 내용 구성과 라이브러리가 마지막으로 적용한 차단 목록 */
export function debugInfo() {
  const sel = getSelection();
  return {
    selection: sel ? Native.selectionCounts(sel) : null,
    lastBlockUpdate: DA.userDefaultsGet('lastBlockUpdate'),
  };
}

/** 익스텐션이 기록한 이벤트(intervalDidStart/End 등) — 실기기 검증용 */
export function getUnlockEvents() {
  return DA.getEvents(ACTIVITY);
}

type AppIconsProps = ViewProps & {
  selection: string | null;
  maxCount?: number;
  iconSize?: number;
  spacing?: number;
};

/** 선택한 앱 아이콘 (Label(token) 네이티브 뷰) */
export const AppIcons = requireNativeViewManager<AppIconsProps>('ScreenTime');

/** 잠글 앱 선택 시트 (FamilyActivityPicker). 선택은 SELECTION_ID 로 App Group 에 저장된다 */
export const AppPickerSheet = DA.DeviceActivitySelectionSheetViewPersisted;
