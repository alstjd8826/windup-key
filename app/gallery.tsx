import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { rise } from '../components/motion';
import DialKnob from '../components/models/DialKnob';
import Hourglass from '../components/models/Hourglass';
import Medal from '../components/models/Medal';
import ModelStage from '../components/models/ModelStage';
import Padlock from '../components/models/Padlock';
import PressableScale from '../components/PressableScale';
import WindupKey from '../components/WindupKey';

type ModelId = 'key' | 'knob' | 'padlock' | 'hourglass' | 'medal';

const MODELS: { id: ModelId; name: string; technique: string }[] = [
  { id: 'key', name: '태엽 열쇠', technique: '두 원 + 오목 필렛 압출, 구멍에 렌즈 회전체' },
  { id: 'knob', name: '볼륨 다이얼', technique: '단면 회전체 + 둘레 홈 36개 반복 배치' },
  { id: 'padlock', name: '자물쇠', technique: '둥근 사각 압출 + 반원 토러스 고리' },
  { id: 'hourglass', name: '모래시계', technique: '수식 단면 유리 회전체 + 모래 회전체' },
  { id: 'medal', name: '메달', technique: '테두리 솟은 회전체 + 별 압출 양각' },
];

/** 모델별 보기 좋은 기본 각도·크기 */
const YAW: Record<ModelId, number> = { key: -0.55, knob: -0.4, padlock: -0.5, hourglass: -0.4, medal: -0.35 };
const FILL: Record<ModelId, number> = { key: 0.85, knob: 0.92, padlock: 0.85, hourglass: 0.85, medal: 0.85 };

function Model({ id, still }: { id: ModelId; still: SharedValue<number> }) {
  switch (id) {
    case 'key':
      return <WindupKey rotation={still} />;
    case 'knob':
      return <DialKnob />;
    case 'padlock':
      return <Padlock />;
    case 'hourglass':
      return <Hourglass />;
    case 'medal':
      return <Medal />;
  }
}

/** 같은 모델링 규칙(기본 도형 조합 + 재질 프리셋 + RoomEnvironment)으로 만든 3D 모델 모음 */
export default function GalleryScreen() {
  const params = useLocalSearchParams<{ model?: string; still?: string }>();
  const still3q = params.still === '1'; // 캡처용: 3/4 각도에 멈춤
  const initial = (MODELS.find((m) => m.id === params.model)?.id ?? 'key') as ModelId;
  const [id, setId] = useState<ModelId>(initial);
  // 딥링크로 다른 모델을 열면 따라간다
  useEffect(() => setId(initial), [initial]);
  const still = useSharedValue(0);
  const current = MODELS.find((m) => m.id === id)!;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Animated.View entering={rise(0)} style={styles.header}>
        <PressableScale onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12}>
          <Text style={styles.back}>닫기</Text>
        </PressableScale>
        <Text style={styles.title}>3D 모델</Text>
        <View style={{ width: 28 }} />
      </Animated.View>

      <View style={styles.stage}>
        <ModelStage key={id} spin={still3q ? 0 : 0.4} yaw={YAW[id]} fill={FILL[id]}>
          <Model id={id} still={still} />
        </ModelStage>
      </View>

      <Animated.View key={`t-${id}`} entering={FadeIn.duration(260)} exiting={FadeOut.duration(120)} style={styles.caption}>
        <Text style={styles.name}>{current.name}</Text>
        <Text style={styles.technique}>{current.technique}</Text>
      </Animated.View>

      <Animated.View entering={rise(3)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {MODELS.map((m) => {
            const on = m.id === id;
            return (
              <PressableScale key={m.id} onPress={() => setId(m.id)} style={[styles.chip, on && styles.chipOn]} scaleTo={0.92}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{m.name}</Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8 },
  back: { fontSize: 14, color: '#666' },
  title: { fontSize: 13, color: '#666' },
  stage: { flex: 1 },
  caption: { alignItems: 'center', gap: 6, paddingHorizontal: 24, marginBottom: 20 },
  name: { fontSize: 28, fontWeight: '300', color: '#111' },
  technique: { fontSize: 13, color: '#888', textAlign: 'center' },
  chips: { gap: 8, paddingHorizontal: 24, paddingBottom: 16 },
  chip: { paddingHorizontal: 16, height: 38, borderRadius: 19, backgroundColor: '#E9E9E9', justifyContent: 'center' },
  chipOn: { backgroundColor: '#111' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextOn: { color: '#fff' },
});
