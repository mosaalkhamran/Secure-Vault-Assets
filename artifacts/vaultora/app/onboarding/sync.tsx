import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/contexts/VaultContext';

export default function SyncSetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { enableiCloudSync } = useVault();
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const ok = await enableiCloudSync();
      if (!ok) {
        Alert.alert(
          t('onboarding.sync.unavailable'),
          t('onboarding.sync.unavailableMsg'),
          [{ text: t('common.ok'), onPress: () => router.push('/onboarding/recovery') }]
        );
        return;
      }
    } finally {
      setLoading(false);
    }
    router.push('/onboarding/recovery');
  };

  const handleSkip = () => {
    router.push('/onboarding/recovery');
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <LinearGradient
        colors={['rgba(94,158,250,0.1)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.progress}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.dot, {
              backgroundColor: i <= 4 ? '#5E9EFA' : colors.border,
              width: i === 4 ? 20 : 8,
            }]} />
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 32 }]}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.iconRing, { borderColor: 'rgba(94,158,250,0.4)', backgroundColor: 'rgba(94,158,250,0.12)' }]}>
            <Ionicons name="cloud-outline" size={44} color="#5E9EFA" />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('onboarding.sync.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {t('onboarding.sync.subtitle')}
          </Text>
        </View>

        {/* Benefits */}
        <View style={[styles.benefitsCard, { backgroundColor: colors.card, borderColor: 'rgba(94,158,250,0.25)' }]}>
          {[
            { icon: 'shield-checkmark-outline', color: '#5E9EFA', text: t('onboarding.sync.benefit1') },
            { icon: 'phone-portrait-outline', color: '#4CAF87', text: t('onboarding.sync.benefit2') },
            { icon: 'lock-closed-outline', color: '#C4975A', text: t('onboarding.sync.benefit3') },
            { icon: 'refresh-outline', color: '#9B59B6', text: t('onboarding.sync.benefit4') },
          ].map((b, i) => (
            <View key={i} style={styles.benefit}>
              <View style={[styles.benefitIcon, { backgroundColor: `${b.color}20` }]}>
                <Ionicons name={b.icon as any} size={18} color={b.color} />
              </View>
              <Text style={[styles.benefitText, { color: colors.foreground }]}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* Free badge */}
        <View style={[styles.freeBadge, { backgroundColor: 'rgba(76,175,135,0.12)', borderColor: 'rgba(76,175,135,0.3)' }]}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF87" />
          <Text style={[styles.freeBadgeText, { color: '#4CAF87' }]}>{t('onboarding.sync.free')}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleEnable}
            disabled={loading}
            style={({ pressed }) => [styles.enableBtn, { opacity: pressed ? 0.9 : 1, backgroundColor: '#5E9EFA' }]}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                  <Text style={styles.enableBtnText}>{t('onboarding.sync.enable')}</Text>
                </>
            }
          </Pressable>

          <Pressable
            onPress={handleSkip}
            disabled={loading}
            style={({ pressed }) => [styles.skipBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.skipBtnText, { color: colors.mutedForeground }]}>{t('onboarding.sync.skip')}</Text>
          </Pressable>
        </View>

        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          {t('onboarding.sync.note')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingBottom: 8 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 24 },
  hero: { alignItems: 'center', gap: 14 },
  iconRing: { width: 96, height: 96, borderRadius: 30, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 24, maxWidth: 320 },
  benefitsCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 14 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  benefitText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  freeBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignSelf: 'center' },
  freeBadgeText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  actions: { gap: 12 },
  enableBtn: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  enableBtnText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#fff' },
  skipBtn: { height: 50, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  skipBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  note: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
