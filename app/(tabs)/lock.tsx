import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { rise } from '../../components/motion';
import PressableScale from '../../components/PressableScale';
import * as ScreenTime from '../../modules/screen-time';
import { useLock } from '../../stores/lock';
import { useUsage } from '../../stores/usage';

export default function LockScreen() {
  const { available, auth, selection, count, refresh } = useLock();
  const session = useUsage((s) => s.session);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const onAuthorize = async () => {
    setBusy(true);
    try {
      await ScreenTime.requestAuthorization();
    } finally {
      refresh();
      setBusy(false);
    }
  };

  const onPickerClosed = () => {
    setPicking(false);
    const unlocked = !!session && session.endsAt > Date.now();
    ScreenTime.applySelection({ unlocked });
    refresh();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Animated.Text entering={rise(0)} style={styles.title}>
        잠금
      </Animated.Text>

      <Animated.Text entering={rise(1)} style={styles.heading}>
        태엽을 감기 전까지{'\n'}잠가 둘 앱
      </Animated.Text>

      {!available ? (
        <Animated.Text entering={rise(2)} style={styles.note}>
          Screen Time 은 실기기에서만 동작합니다.
        </Animated.Text>
      ) : auth !== 'approved' ? (
        <Animated.View entering={rise(2)} style={styles.block}>
          <Text style={styles.noteInBlock}>
            {auth === 'denied'
              ? '스크린 타임 권한이 거부됐습니다. 다시 요청해 주세요.'
              : '앱을 잠그려면 스크린 타임 권한이 필요합니다.'}
          </Text>
          <PressableScale onPress={onAuthorize} disabled={busy} style={styles.primary}>
            <Text style={styles.primaryText}>{busy ? '요청 중…' : '스크린 타임 권한 허용'}</Text>
          </PressableScale>
        </Animated.View>
      ) : (
        <Animated.View entering={rise(2)} style={styles.block}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{count > 0 ? `선택한 앱 ${count}개` : '아직 선택한 앱이 없습니다'}</Text>
            {count > 0 && (
              <Animated.View entering={FadeIn.duration(250)}>
                <ScreenTime.AppIcons selection={selection} maxCount={6} iconSize={40} spacing={12} style={styles.icons} />
              </Animated.View>
            )}
          </View>
          <PressableScale onPress={() => setPicking(true)} style={styles.primary}>
            <Text style={styles.primaryText}>{count > 0 ? '잠글 앱 바꾸기' : '잠글 앱 고르기'}</Text>
          </PressableScale>
          <Text style={styles.noteInBlock}>고른 앱은 바로 잠기고, 타이머가 도는 동안만 열립니다.</Text>
        </Animated.View>
      )}

      <Modal visible={picking} presentationStyle="pageSheet" animationType="slide" onRequestClose={onPickerClosed}>
        <ScreenTime.AppPickerSheet
          familyActivitySelectionId={ScreenTime.SELECTION_ID}
          onSelectionChange={() => {}}
          onDismissRequest={onPickerClosed}
          headerText="잠글 앱을 고르세요"
          style={styles.picker}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  title: { marginTop: 8, marginLeft: 24, fontSize: 13, color: '#666' },
  heading: { marginTop: 28, marginHorizontal: 24, fontSize: 28, lineHeight: 36, fontWeight: '300', color: '#111' },
  block: { marginTop: 28, paddingHorizontal: 24, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 14 },
  cardLabel: { fontSize: 14, color: '#444' },
  icons: { height: 44 },
  primary: { height: 54, borderRadius: 27, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  note: { fontSize: 13, lineHeight: 19, color: '#888', marginHorizontal: 24 },
  noteInBlock: { fontSize: 13, lineHeight: 19, color: '#888' },
  picker: { flex: 1 },
});
