import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useUsage } from '../stores/usage';

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
      if (s && s.endsAt > Date.now()) {
        // 네비게이터가 마운트된 다음 프레임에 이동
        requestAnimationFrame(() => router.replace('/timer'));
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
        <Stack.Screen name="wind" options={{ animation: 'fade' }} />
        {/* 타이머 중에는 스와이프로 뒤로 못 나간다 */}
        <Stack.Screen name="timer" options={{ gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
