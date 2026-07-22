import React, { useState } from 'react';
import {
  Alert, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/contexts/VaultContext';
import PinPad from '@/components/PinPad';

type Step = 'options' | 'face-id' | 'new-pin' | 'confirm-new-pin';

export default function ForgotPinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { createPin, unlock, settings, isFaceIdAvailable, authenticateWithFaceId } = useVault();
  const [step, setStep] = useState<Step>('options');
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleFaceId = async () => {
    const success = await authenticateWithFaceId();
    if (success) setStep('new-pin');
    else Alert.alert('Face ID Failed', 'Authentication unsuccessful. Try again.');
  };

  const handleNewPin = (pin: string) => {
    setNewPin(pin);
    setStep('confirm-new-pin');
  };

  const handleConfirmPin = async (pin: string) => {
    if (pin !== newPin) { setPinError(true); return; }
    await createPin(pin);
    unlock();
    router.replace('/');
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => step === 'options' ? router.back() : setStep('options')}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {step === 'options' ? 'Forgot PIN' :
           step === 'new-pin' ? 'New PIN' :
           step === 'confirm-new-pin' ? 'Confirm PIN' : 'Forgot PIN'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Options ── */}
        {step === 'options' && (
          <>
            <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Your PIN is never stored in plain text. Use Face ID to reset it, or wipe the vault to start over.
              </Text>
            </View>

            <View style={styles.options}>
              {/* Face ID */}
              {settings.faceIdEnabled && isFaceIdAvailable && (
                <OptionCard
                  icon="scan-outline"
                  iconColor="#5E9EFA"
                  title="Use Face ID"
                  description="Verify with Face ID to set a new PIN"
                  onPress={handleFaceId}
                  colors={colors}
                />
              )}

              {/* iCloud Keychain info */}
              <View style={[styles.icloudCard, { backgroundColor: 'rgba(94,158,250,0.08)', borderColor: 'rgba(94,158,250,0.25)' }]}>
                <View style={[styles.optionIcon, { backgroundColor: 'rgba(94,158,250,0.15)' }]}>
                  <Ionicons name="cloud-outline" size={22} color="#5E9EFA" />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: '#5E9EFA' }]}>iCloud Recovery</Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    Changing phones? Your vault settings are saved in iCloud Keychain. Sign in with the same Apple ID on your new device and your PIN will work there.
                  </Text>
                </View>
              </View>

              {/* Wipe */}
              <OptionCard
                icon="trash-outline"
                iconColor={colors.destructive}
                title="Wipe & Start Over"
                description="Delete all vault data and create a new vault"
                onPress={() => {
                  Alert.alert(
                    'Wipe Vault',
                    'This permanently deletes all photos and videos in your vault. This cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Wipe Everything', style: 'destructive', onPress: () => router.replace('/onboarding') },
                    ]
                  );
                }}
                colors={colors}
                danger
              />
            </View>
          </>
        )}

        {/* ── New PIN ── */}
        {step === 'new-pin' && (
          <View style={styles.pinSection}>
            <PinPad onComplete={handleNewPin} subtitle="Create a new 6-digit PIN" />
          </View>
        )}

        {/* ── Confirm new PIN ── */}
        {step === 'confirm-new-pin' && (
          <View style={styles.pinSection}>
            <PinPad
              onComplete={handleConfirmPin}
              error={pinError}
              onErrorReset={() => setPinError(false)}
              subtitle="Confirm your new PIN"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function OptionCard({ icon, iconColor, title, description, onPress, colors, danger }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.optionCard, {
        backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1,
      }]}
    >
      <View style={[styles.optionIcon, { backgroundColor: `${iconColor}22` }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, { color: danger ? colors.destructive : colors.foreground }]}>{title}</Text>
        <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </Pressable>
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
  content: { padding: 20, gap: 20 },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  options: { gap: 12 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
  },
  icloudCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  optionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  optionDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4, lineHeight: 18 },
  pinSection: { paddingTop: 20 },
});
