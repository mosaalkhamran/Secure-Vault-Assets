import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/contexts/VaultContext';
import PinPad from '@/components/PinPad';

export default function ConfirmPinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pin } = useLocalSearchParams<{ pin: string }>();
  const { createPin } = useVault();
  const [error, setError] = useState(false);

  const handleConfirm = async (confirmedPin: string) => {
    if (confirmedPin !== pin) {
      setError(true);
      return;
    }
    await createPin(confirmedPin);
    router.push('/onboarding/face-id');
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.progress}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.dot, { backgroundColor: i <= 1 ? colors.primary : colors.border }]} />
          ))}
        </View>
        <View style={styles.backBtn} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.titleSection}>
          <View style={[styles.iconBg, { backgroundColor: 'rgba(196,151,90,0.15)' }]}>
            <Ionicons name="checkmark-circle-outline" size={32} color="#C4975A" />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Confirm PIN</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Enter your PIN one more time to confirm
          </Text>
        </View>

        <PinPad
          onComplete={handleConfirm}
          error={error}
          onErrorReset={() => setError(false)}
          subtitle={error ? 'PINs do not match. Try again.' : undefined}
        />
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
  content: { flex: 1, paddingHorizontal: 32, gap: 32 },
  titleSection: { alignItems: 'center', gap: 12, paddingTop: 20 },
  iconBg: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
