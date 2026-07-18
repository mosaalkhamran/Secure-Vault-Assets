import React, { useRef, useEffect } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';

const FEATURES = [
  { icon: 'shield-checkmark-outline', label: 'AES-256 encryption on-device' },
  { icon: 'cloud-offline-outline', label: 'No developer access to your files' },
  { icon: 'eye-off-outline', label: 'Invisible to Photos app' },
  { icon: 'key-outline', label: 'Multiple recovery options' },
];

export default function OnboardingWelcome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <LinearGradient
        colors={['rgba(196,151,90,0.12)', 'transparent']}
        style={styles.glow}
      />

      <Animated.View
        style={[styles.content, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          paddingTop: insets.top + 60,
          paddingBottom: insets.bottom + 24,
        }]}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={[styles.shieldBg, { backgroundColor: 'rgba(196,151,90,0.15)', borderColor: 'rgba(196,151,90,0.3)' }]}>
            <Ionicons name="shield-checkmark" size={52} color="#C4975A" />
          </View>
          <Text style={styles.appName}>Vaultora</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Your private photo & video vault
          </Text>
        </View>

        {/* Features */}
        <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(196,151,90,0.15)' }]}>
                <Ionicons name={f.icon as any} size={18} color="#C4975A" />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <Pressable
          onPress={() => router.push('/onboarding/create-pin')}
          style={({ pressed }) => [styles.ctaBtn, { backgroundColor: '#C4975A', opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.ctaBtnText}>Create Your Vault</Text>
          <Ionicons name="arrow-forward" size={18} color="#0A0A12" />
        </Pressable>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Your data never leaves your device or iCloud account.{'\n'}The developer has no access to your files.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glow: { ...StyleSheet.absoluteFillObject, bottom: '50%' },
  content: { flex: 1, paddingHorizontal: 24, gap: 24 },
  logoSection: { alignItems: 'center', gap: 12 },
  shieldBg: {
    width: 100, height: 100, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  appName: {
    fontSize: 36, fontFamily: 'Inter_700Bold', color: '#EDE8DF', letterSpacing: -0.5,
  },
  tagline: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  featuresCard: {
    borderRadius: 20, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
  },
  featureIcon: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  featureText: { fontSize: 14, fontFamily: 'Inter_500Medium', flex: 1 },
  ctaBtn: {
    height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  ctaBtnText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#0A0A12' },
  disclaimer: {
    fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18,
  },
});
