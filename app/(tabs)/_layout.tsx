import { Tabs } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PressableScale from '../../components/PressableScale';
import { HomeIcon, LockIcon, SettingsIcon } from '../../components/TabIcons';

const TABS = {
  index: { label: '홈', Icon: HomeIcon },
  lock: { label: '잠금', Icon: LockIcon },
  settings: { label: '설정', Icon: SettingsIcon },
} as const;

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ACTIVE = '#111';
const INACTIVE = '#A8A8A8';

/** 선택된 탭 뒤로 흰 알약이 스프링으로 미끄러지는 탭바 */
function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [w, setW] = useState(0);
  const slot = w / state.routes.length;
  const x = useSharedValue(0);

  useEffect(() => {
    if (slot) x.value = withSpring(state.index * slot, { damping: 18, stiffness: 220 });
  }, [state.index, slot, x]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.track} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {slot > 0 && <Animated.View style={[styles.pill, { width: slot - 8 }, pillStyle]} />}
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const meta = TABS[route.name as keyof typeof TABS];
          if (!meta) return null;
          const color = focused ? ACTIVE : INACTIVE;
          return (
            <PressableScale
              key={route.key}
              scaleTo={0.9}
              style={styles.item}
              onPress={() => {
                const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !e.defaultPrevented) navigateToTab(route.key);
              }}
            >
              <meta.Icon color={color} />
              <Text style={[styles.label, { color }]}>{meta.label}</Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, animation: 'shift' }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="lock" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: '#F5F5F5', paddingHorizontal: 40, paddingTop: 8 },
  track: {
    flexDirection: 'row',
    backgroundColor: '#ECECEC',
    borderRadius: 28,
    padding: 0,
    height: 56,
  },
  pill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 24,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 10, fontWeight: '500' },
});
