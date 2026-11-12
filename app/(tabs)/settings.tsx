import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { rise } from '../../components/motion';
import PressableScale from '../../components/PressableScale';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Animated.Text entering={rise(0)} style={styles.title}>
        설정
      </Animated.Text>
      <Animated.View entering={rise(1)} style={styles.block}>
        <PressableScale onPress={() => router.push('/gallery')} style={styles.row}>
          <View>
            <Text style={styles.rowTitle}>3D 모델 갤러리</Text>
            <Text style={styles.rowSub}>태엽과 같은 방식으로 만든 다른 모델들</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </PressableScale>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  title: { marginTop: 8, marginLeft: 24, fontSize: 13, color: '#666' },
  block: { marginTop: 24, paddingHorizontal: 24 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: { fontSize: 16, color: '#111' },
  rowSub: { fontSize: 12, color: '#999', marginTop: 4 },
  chevron: { fontSize: 24, color: '#BBB' },
});
