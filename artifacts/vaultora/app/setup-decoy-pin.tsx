import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/contexts/VaultContext';
import PinPad from '@/components/PinPad';

type Step = 'intro' | 'enter' | 'confirm';

export default function SetupDecoyPinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setupDecoyPin, verifyPin } = useVault();

  const [step, setStep] = useState<Step>('intro');
  const [decoyPin, setDecoyPin] = useState('');
  const [error, setError] = useState(false);

  const handleFirstPin = async (pin: string) => {
    // Make sure decoy PIN is different from real PIN
    const isSameAsReal = await verifyPin(pin);
    if (isSameAsReal) {
      setError(true);
      Alert.alert('Invalid PIN', 'The decoy PIN cannot be the same as your real vault PIN.');
      return;
    }
    setDecoyPin(pin);
    setStep('confirm');
    setError(false);
  };

  const handleConfirmPin = async (pin: string) => {
    if (pin !== decoyPin) {
      setError(true);
      return;
    }
    await setupDecoyPin(pin);
    Alert.alert(
      'Decoy Vault Active',
      'Your decoy PIN is set. Entering it on the lock screen will open an empty vault.',
      [{ text: 'Done', onPress: () => router.back() }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => step === 'intro' ? router.back() : setStep(step === 'confirm' ? 'enter' : 'intro')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Decoy Vault</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {step === 'intro' && (
          <View style={styles.introSection}>
            <LinearGradient colors={['rgba(155,89,182,0.2)', 'transparent']} style={styles.iconGlow}>
              <View style={[styles.iconBg, { backgroundColor: 'rgba(155,89,182,0.12)' }]}>
                <Ionicons name="glasses-outline" size={40} color="#9B59B6" />
              </View>
            </LinearGradient>
            <Text style={[styles.introTitle, { color: colors.foreground }]}>How Decoy Vault Works</Text>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {[
                { icon: 'lock-closed-outline', title: 'Two PINs, Two Realities', desc: 'Your real PIN opens your actual vault with all your files. The decoy PIN opens a completely empty vault.' },
                { icon: 'eye-off-outline', title: 'Plausible Deniability', desc: 'If someone forces you to unlock your vault, enter the decoy PIN. They will see an empty vault.' },
                { icon: 'shield-checkmark-outline', title: 'Silent & Seamless', desc: 'The decoy vault looks and works exactly like the real one — no indication it is a decoy.' },
                { icon: 'warning-outline', title: 'Important', desc: 'The decoy PIN must be different from your real PIN. Never share your real PIN. Your actual files remain safe.' },
              ].map((item, i) => (
                <View key={i} style={[styles.featureRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                  <View style={[styles.featureIcon, { backgroundColor: 'rgba(155,89,182,0.12)' }]}>
                    <Ionicons name={item.icon as any} size={18} color="#9B59B6" />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={[styles.featureTitle, { color: colors.foreground }]}>{item.title}</Text>
                    <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => setStep('enter')}
              style={({ pressed }) => [styles.ctaBtn, { backgroundColor: '#9B59B6', opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color="#FFF" />
              <Text style={styles.ctaBtnText}>Set Up Decoy PIN</Text>
            </Pressable>
          </View>
        )}

        {step === 'enter' && (
          <View style={styles.pinSection}>
            <Text style={[styles.pinHint, { color: colors.mutedForeground }]}>
              Choose a PIN that is different from your real vault PIN
            </Text>
            <PinPad
              onComplete={handleFirstPin}
              error={error}
              onErrorReset={() => setError(false)}
              subtitle="Create Decoy PIN"
            />
          </View>
        )}

        {step === 'confirm' && (
          <View style={styles.pinSection}>
            <Text style={[styles.pinHint, { color: colors.mutedForeground }]}>
              Enter the decoy PIN again to confirm
            </Text>
            <PinPad
              onComplete={handleConfirmPin}
              error={error}
              onErrorReset={() => setError(false)}
              subtitle="Confirm Decoy PIN"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  content: { paddingHorizontal: 24, gap: 20 },
  introSection: { gap: 20, alignItems: 'center' },
  iconGlow: { borderRadius: 40, padding: 8 },
  iconBg: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  introTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', width: '100%' },
  featureRow: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'flex-start' },
  featureIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  featureDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  ctaBtn: { width: '100%', height: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#FFF' },
  pinSection: { gap: 12, paddingTop: 12 },
  pinHint: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
});
