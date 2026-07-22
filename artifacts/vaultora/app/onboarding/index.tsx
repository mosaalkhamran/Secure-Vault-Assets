import React from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/contexts/VaultContext';

export default function OnboardingWelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { cloudRestoreAvailable, restoreFromCloud, unlock } = useVault();
  const [restoring, setRestoring] = React.useState(false);

  const FEATURES = [
    { icon: 'shield-checkmark-outline', title: t('onboarding.welcome.features.encryptionTitle'), desc: t('onboarding.welcome.features.encryptionDesc') },
    { icon: 'eye-off-outline', title: t('onboarding.welcome.features.zeroVisibilityTitle'), desc: t('onboarding.welcome.features.zeroVisibilityDesc') },
    { icon: 'scan-outline', title: t('onboarding.welcome.features.faceIdTitle'), desc: t('onboarding.welcome.features.faceIdDesc') },
    { icon: 'cloud-outline', title: t('onboarding.welcome.features.iCloudTitle'), desc: t('onboarding.welcome.features.iCloudDesc') },
  ];

  const handleRestore = async () => {
    setRestoring(true);
    const ok = await restoreFromCloud();
    setRestoring(false);
    if (ok) {
      unlock();
      router.replace('/');
    } else {
      Alert.alert(t('common.error'), t('onboarding.welcome.restoreDesc'));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <LinearGradient
        colors={['rgba(196,151,90,0.12)', 'transparent']}
        style={styles.gradient}
      />

      <View style={[styles.hero, { paddingTop: insets.top + 40 }]}>
        <View style={[styles.shieldBg, { backgroundColor: 'rgba(196,151,90,0.15)', borderColor: 'rgba(196,151,90,0.3)' }]}>
          <Ionicons name="shield-checkmark" size={52} color="#C4975A" />
        </View>
        <Text style={[styles.appName, { color: colors.foreground }]}>Vaultora</Text>
        <Text style={[styles.tagline, { color: '#C4975A' }]}>{t('onboarding.welcome.tagline')}</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {t('onboarding.welcome.description')}
        </Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((f, i) => (
          <View key={i} style={[styles.featureRow, { borderBottomColor: colors.border, borderBottomWidth: i < FEATURES.length - 1 ? StyleSheet.hairlineWidth : 0 }]}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(196,151,90,0.12)' }]}>
              <Ionicons name={f.icon as any} size={18} color="#C4975A" />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
              <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {/* iCloud restore banner — shown only on fresh install with cloud data */}
        {cloudRestoreAvailable && (
          <Pressable
            onPress={handleRestore}
            disabled={restoring}
            style={[styles.restoreBtn, { backgroundColor: 'rgba(94,158,250,0.15)', borderColor: 'rgba(94,158,250,0.4)' }]}
          >
            {restoring
              ? <ActivityIndicator size="small" color="#5E9EFA" />
              : <Ionicons name="cloud-download-outline" size={18} color="#5E9EFA" />
            }
            <View style={{ flex: 1 }}>
              <Text style={[styles.restoreTitle, { color: '#5E9EFA' }]}>{t('onboarding.welcome.restoreTitle')}</Text>
              <Text style={[styles.restoreDesc, { color: colors.mutedForeground }]}>{t('onboarding.welcome.restoreDesc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#5E9EFA" />
          </Pressable>
        )}

        <Pressable
          onPress={() => router.push('/onboarding/face-id')}
          style={({ pressed }) => [styles.getStartedBtn, { backgroundColor: '#C4975A', opacity: pressed ? 0.9 : 1 }]}
        >
          <Text style={styles.getStartedText}>{t('onboarding.welcome.setupNew')}</Text>
          <Ionicons name="arrow-forward" size={18} color="#0A0A12" />
        </Pressable>
        <Text style={[styles.legal, { color: colors.mutedForeground }]}>
          {t('onboarding.welcome.legal')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { ...StyleSheet.absoluteFillObject, bottom: '50%' },
  hero: { paddingHorizontal: 32, alignItems: 'center', gap: 12 },
  shieldBg: { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  appName: { fontSize: 36, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  tagline: { fontSize: 15, fontFamily: 'Inter_500Medium', letterSpacing: 0.5 },
  description: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 24, marginTop: 4 },
  features: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  featureDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2, lineHeight: 18 },
  footer: { paddingHorizontal: 24, gap: 12 },
  getStartedBtn: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  getStartedText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#0A0A12' },
  legal: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  restoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1 },
  restoreTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  restoreDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
});
