import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { rise } from '../../components/motion';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Animated.Text entering={rise(0)} style={styles.title}>
        설정
      </Animated.Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  title: { marginTop: 8, marginLeft: 24, fontSize: 13, color: '#666' },
});
