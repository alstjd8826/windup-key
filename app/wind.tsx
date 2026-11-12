import { StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import KeyCanvas from '../components/KeyCanvas';
import { useWindGesture } from '../hooks/useWindGesture';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function WindScreen() {
  const { gesture, total, minutes, onKeyLayout } = useWindGesture();

  // 디버그: 누적 각도를 리렌더 없이 표시
  const degProps = useAnimatedProps(() => {
    const text = `${Math.round((total.value * 180) / Math.PI)}°`;
    return { text, defaultValue: text } as object;
  });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.keyArea} onLayout={onKeyLayout}>
        <KeyCanvas rotation={total} widthRatio={0.45} />
      </View>

      {__DEV__ && (
        <View style={styles.debug} pointerEvents="none">
          <AnimatedTextInput editable={false} style={styles.debugText} animatedProps={degProps} />
          <Text style={styles.debugText}>minutes {minutes}</Text>
        </View>
      )}

      {/* Canvas 위에 덮는 투명 제스처 레이어 (Canvas 자체 터치는 쓰지 않음) */}
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill} collapsable={false} />
      </GestureDetector>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  keyArea: { height: '45%' },
  debug: { alignItems: 'center', gap: 4 },
  debugText: { fontSize: 16, color: '#888', fontVariant: ['tabular-nums'], padding: 0 },
});
