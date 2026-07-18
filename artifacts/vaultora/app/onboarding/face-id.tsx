import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/contexts/VaultContext';

export default function FaceIdScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { enableFaceId, isFaceIdAvailable } = useVault();
  const [enabling, setEnabling] = useState(false);

  const handleEnable = async () => {
    setEnabling(true);
    const success = await enableFaceId();
    setEnabling(false);
    router.push('/onboarding/recovery-key');
  };

  const handleSkip = () => {
    router.push('/onboarding/recovery-key');
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.progress}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.dot, { backgroundColor: i <= 2 ? colors.primary : colors.border }]} />
          ))}
        </View>
        <View style={styles.backBtn} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.main}>
          <View style={[styles.scanIcon, { backgroundColor: 'rgba(94,158,250,0.15)', borderColor: 'rgba(94,158,250,0.3)' }]}>
            <Ionicons name="scan-outline" size={56} color="#5E9EFA" />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Enable Face ID</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Unlock your vault instantly with Face ID. You can always use your PIN as backup.
          </Text>
        </View>

        <View style={styles.actions}>
          {isFaceIdAvailable ? (
            <Pressable
              onPress={handleEnable}
              disabled={enabling}
              style={({ pressed }) => [styles.enableBtn, { backgroundColor: '#5E9EFA', opacity: pressed || enabling ? 0.8 : 1 }]}
            >
              <Ionicons name="scan" size={20} color="#0A0A12" />
              <Text style={styles.enableBtnText}>{enabling ? 'Authenticating...' : 'Enable Face ID'}</Text>
            </Pressable>
          ) : (
            <View style={[styles.notAvailable, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.mutedForeground} />
              <Text style={[styles.notAvailableText, { color: colors.mutedForeground }]}>
                Face ID is not available on this device
              </Text>
            </View>
          )}
          <Pressable onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip for now</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progress: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  content: { flex: 1, paddingHorizontal: 32, justifyContent: 'space-between' },
  main: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  scanIcon: {
    width: 120, height: 120, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  body: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 24 },
  actions: { gap: 16, alignItems: 'center' },
  enableBtn: {
    width: '100%', height: 56, borderRadius: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  enableBtnText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#0A0A12' },
  notAvailable: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, width: '100%',
  },
  notAvailableText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  skipText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
