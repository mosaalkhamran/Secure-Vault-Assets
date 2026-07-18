import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/contexts/VaultContext';

export default function FaceIdScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { enableFaceId, isFaceIdAvailable } = useVault();
  const [status, setStatus] = useState<'idle' | 'success' | 'denied'>('idle');

  const handleEnable = async () => {
    const ok = await enableFaceId();
    setStatus(ok ? 'success' : 'denied');
    if (ok) setTimeout(() => router.push('/onboarding/recovery-key'), 800);
  };

  const handleSkip = () => router.push('/onboarding/recovery-key');

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.progress}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.dot, { backgroundColor: i <= 2 ? colors.primary : colors.border }]} />
          ))}
        </View>
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.titleSection}>
          <LinearGradient colors={['rgba(196,151,90,0.2)', 'transparent']} style={styles.iconGlow}>
            <View style={[styles.iconBg, { backgroundColor: 'rgba(94,158,250,0.15)' }]}>
              <Ionicons
                name={status === 'success' ? 'checkmark-circle-outline' : 'scan-outline'}
                size={40}
                color={status === 'success' ? '#4CAF87' : '#5E9EFA'}
              />
            </View>
          </LinearGradient>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {isFaceIdAvailable ? 'Enable Face ID' : 'Biometric Login'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {isFaceIdAvailable
              ? 'Unlock your vault instantly without entering your PIN every time'
              : 'Face ID is not available on this device. You can enable it later in Settings if you enroll biometrics.'}
          </Text>
        </View>

        {isFaceIdAvailable && (
          <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { icon: 'flash-outline', label: 'Instant unlock — no PIN required' },
              { icon: 'shield-checkmark-outline', label: 'Your Face ID data stays on device' },
              { icon: 'key-outline', label: 'PIN always available as fallback' },
            ].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name={f.icon as any} size={18} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.foreground }]}>{f.label}</Text>
              </View>
            ))}
          </View>
        )}

        {status === 'denied' && (
          <View style={[styles.warningBox, { backgroundColor: 'rgba(224,85,85,0.1)', borderColor: 'rgba(224,85,85,0.3)' }]}>
            <Ionicons name="warning-outline" size={16} color={colors.destructive} />
            <Text style={[styles.warningText, { color: colors.destructive }]}>
              Face ID access was denied. Enable it in iOS Settings → Privacy → Face ID & Passcode → Vaultora.
            </Text>
          </View>
        )}

        {status === 'success' && (
          <View style={[styles.successBox, { backgroundColor: 'rgba(76,175,135,0.1)', borderColor: 'rgba(76,175,135,0.3)' }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF87" />
            <Text style={[styles.successText, { color: '#4CAF87' }]}>Face ID enabled successfully!</Text>
          </View>
        )}

        <View style={styles.actions}>
          {isFaceIdAvailable && status !== 'success' && (
            <Pressable
              onPress={handleEnable}
              style={({ pressed }) => [styles.enableBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="scan-outline" size={18} color={colors.primaryForeground} />
              <Text style={[styles.enableBtnText, { color: colors.primaryForeground }]}>Enable Face ID</Text>
            </Pressable>
          )}
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [styles.skipBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.skipBtnText, { color: colors.mutedForeground }]}>
              {isFaceIdAvailable ? 'Skip for now' : 'Continue'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingBottom: 12 },
  progress: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  content: { flex: 1, paddingHorizontal: 32, gap: 24, justifyContent: 'center' },
  titleSection: { alignItems: 'center', gap: 16 },
  iconGlow: { borderRadius: 40, padding: 8 },
  iconBg: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 24 },
  featureCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  warningBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  warningText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  successText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  actions: { gap: 12 },
  enableBtn: { height: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  enableBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  skipBtn: { height: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  skipBtnText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
});
