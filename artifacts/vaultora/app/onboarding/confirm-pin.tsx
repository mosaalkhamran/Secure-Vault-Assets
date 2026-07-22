import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/contexts/VaultContext';
import PinPad from '@/components/PinPad';

export default function ConfirmPinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { pin } = useLocalSearchParams<{ pin: string }>();
  const { createPin } = useVault();
  const [error, setError] = useState(false);

  const handleConfirm = async (confirmedPin: string) => {
    if (confirmedPin !== pin) {
      setError(true);
      return;
    }
    await createPin(confirmedPin);
    // Go to sync setup → recovery setup → home
    router.push('/onboarding/sync');
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        {/* Step 3 of 3 */}
        <View style={styles.progress}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.dot, { backgroundColor: colors.primary }]} />
          ))}
        </View>
        <View style={styles.backBtn} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.titleSection}>
          <View style={[styles.iconBg, { backgroundColor: 'rgba(76,175,135,0.15)' }]}>
            <Ionicons name="checkmark-circle-outline" size={32} color="#4CAF87" />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('onboarding.confirmPin.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {t('onboarding.confirmPin.subtitle')}
          </Text>
        </View>

        <PinPad
          onComplete={handleConfirm}
          error={error}
          onErrorReset={() => setError(false)}
          subtitle={error ? t('onboarding.confirmPin.error') : undefined}
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
