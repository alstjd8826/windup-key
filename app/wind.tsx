import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import KeyCanvas from '../components/KeyCanvas';

export default function WindScreen() {
  const rotation = useSharedValue(0);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.keyArea}>
        <KeyCanvas rotation={rotation} widthRatio={0.45} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  keyArea: { height: '45%' },
});
