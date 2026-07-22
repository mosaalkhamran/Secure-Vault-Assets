import React from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/contexts/VaultContext';

const FEATURES = [
  { icon: 'shield-checkmark-outline', title: 'Military-grade encryption', desc: 'AES-256-GCM protects every photo and video' },
  { icon: 'eye-off-outline', title: 'Zero visibility', desc: 'App Switcher and notifications never reveal contents' },
  { icon: 'scan-outline', title: 'Face ID unlock', desc: 'Instant access with your face — no PIN every time' },
  { icon: 'cloud-outline', title: 'iCloud backup', desc: 'Encrypted automatic sync — free for everyone' },
];

export default function OnboardingWelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cloudRestoreAvailable, restoreFromCloud, unlock } = useVault();
  const [restoring, setRestoring] = React.useState(false);

  const handleRestore = async () => {
    setRestoring(true);
    const ok = await restoreFromCloud();
    setRestoring(false);
    if (ok) {
      unlock();
      router.replace('/');
    } else {
      Alert.alert('تعذّرت الاستعادة', 'تأكد من اتصالك بالإنترنت وتفعيل iCloud، ثم حاول مجدداً.');
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
        <Text style={[styles.tagline, { color: '#C4975A' }]}>Your private vault</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          The most private place for your photos and videos — locked, encrypted, and under your control.
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
              <Text style={[styles.restoreTitle, { color: '#5E9EFA' }]}>استعادة خزنتك من iCloud</Text>
              <Text style={[styles.restoreDesc, { color: colors.mutedForeground }]}>وجدنا نسخة احتياطية — اضغط لاستعادتها</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#5E9EFA" />
          </Pressable>
        )}

        <Pressable
          onPress={() => router.push('/onboarding/face-id')}
          style={({ pressed }) => [styles.getStartedBtn, { backgroundColor: '#C4975A', opacity: pressed ? 0.9 : 1 }]}
        >
          <Text style={styles.getStartedText}>إعداد جديد</Text>
          <Ionicons name="arrow-forward" size={18} color="#0A0A12" />
        </Pressable>
        <Text style={[styles.legal, { color: colors.mutedForeground }]}>
          By continuing you agree to our Privacy Policy and Terms of Use
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
