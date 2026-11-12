import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Asset } from 'expo-asset';

import * as ScreenTime from '../modules/screen-time';
import { useLock } from '../stores/lock';
import { useUsage } from '../stores/usage';

/** 차단 화면 설정 + 타이머가 없는데 풀려 있으면 다시 잠금 */
async function setupScreenTime() {
  if (!ScreenTime.isAvailable()) return;
  let image: string | undefined;
  try {
    const [asset] = await Asset.loadAsync(require('../assets/shield-key.png'));
    if (asset.localUri) image = ScreenTime.installShieldImage(asset.localUri);
  } catch (e) {
    console.warn('[screen-time] shield image', e);
  }
  ScreenTime.configureShield(image);
  useLock.getState().refresh();
}

/**
 * 저장된 상태를 불러온 뒤:
 * - 날짜가 바뀌었으면 오늘 푼 시간 초기화
 * - 진행 중인 타이머가 남아 있으면 타이머 화면으로 복귀, 이미 지났으면 정리
 */
function useRestoreSession() {
  useEffect(() => {
    const onHydrated = () => {
      useUsage.getState().restore();
      const s = useUsage.getState().session;
      setupScreenTime().then(() => {
        // 세션이 없으면 확실히 잠근다(앱이 꺼진 사이 익스텐션이 못 잠갔을 때 대비)
        if (!(s && s.endsAt > Date.now()) && ScreenTime.isAvailable()) ScreenTime.lockNow();
      });
      if (s && s.endsAt > Date.now()) {
        // 네비게이터가 마운트된 다음 프레임에 이동
        requestAnimationFrame(() => router.push('/timer')); // 홈 위에 쌓아서 끝나면 홈으로
      }
    };
    const unsub = useUsage.persist.onFinishHydration(onHydrated);
    if (useUsage.persist.hasHydrated()) onHydrated();

    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') useUsage.getState().rollover();
    });
    return () => {
      unsub();
      sub.remove();
    };
  }, []);
}

export default function RootLayout() {
  useRestoreSession();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="wind" options={{ animation: 'fade_from_bottom' }} />
        {/* 타이머 중에는 스와이프로 뒤로 못 나간다 */}
        <Stack.Screen name="timer" options={{ gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
