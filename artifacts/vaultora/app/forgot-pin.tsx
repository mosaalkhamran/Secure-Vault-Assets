import React, { useState } from 'react';
import {
  Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/contexts/VaultContext';
import PinPad from '@/components/PinPad';

type Step = 'options' | 'face-id' | 'recovery-key' | 'new-pin' | 'confirm-new-pin';

export default function ForgotPinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { verifyRecoveryKey, createPin, unlock, settings, isFaceIdAvailable, authenticateWithFaceId } = useVault();
  const [step, setStep] = useState<Step>('options');
  const [recoveryInput, setRecoveryInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleFaceId = async () => {
    const success = await authenticateWithFaceId();
    if (success) setStep('new-pin');
    else Alert.alert('Face ID Failed', 'Authentication unsuccessful. Try another recovery method.');
  };

  const handleRecoveryKey = async () => {
    const valid = await verifyRecoveryKey(recoveryInput.toLowerCase().trim());
    if (valid) {
      setStep('new-pin');
    } else {
      Alert.alert('Invalid Key', 'The recovery key you entered is incorrect. Please check and try again.');
    }
  };

  const handleNewPin = (pin: string) => {
    setNewPin(pin);
    setStep('confirm-new-pin');
  };

  const handleConfirmPin = async (pin: string) => {
    if (pin !== newPin) {
      setPinError(true);
      return;
    }
    await createPin(pin);
    unlock();
    router.replace('/');
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => step === 'options' ? router.back() : setStep('options')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {step === 'options' ? 'Forgot PIN' :
           step === 'recovery-key' ? 'Recovery Key' :
           step === 'new-pin' ? 'New PIN' :
           step === 'confirm-new-pin' ? 'Confirm PIN' : 'Forgot PIN'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 'options' && (
          <>
            <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                We cannot show your PIN as it is never stored. Choose a recovery method to set a new PIN.
              </Text>
            </View>

            <View style={styles.options}>
              {settings.faceIdEnabled && isFaceIdAvailable && (
                <OptionCard
                  icon="scan-outline"
                  iconColor="#5E9EFA"
                  title="Use Face ID"
                  description="Authenticate with Face ID to reset your PIN"
                  onPress={handleFaceId}
                  colors={colors}
                />
              )}
              <OptionCard
                icon="key-outline"
                iconColor="#F5A623"
                title="Recovery Key"
                description="Enter your 12-word recovery key"
                onPress={() => setStep('recovery-key')}
                colors={colors}
              />
              <OptionCard
                icon="trash-outline"
                iconColor={colors.destructive}
                title="Wipe & Start Over"
                description="Delete all vault data permanently"
                onPress={() => {
                  Alert.alert(
                    'Wipe Vault',
                    'This will permanently delete all your vault data. This cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Wipe Everything', style: 'destructive', onPress: () => router.push('/(tabs)/settings') },
                    ]
                  );
                }}
                colors={colors}
                danger
              />
            </View>
          </>
        )}

        {step === 'recovery-key' && (
          <View style={styles.recoverySection}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              Enter your 12-word recovery key, separated by spaces
            </Text>
            <TextInput
              value={recoveryInput}
              onChangeText={setRecoveryInput}
              placeholder="word1 word2 word3 ..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.recoveryInput, {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.input,
              }]}
            />
            <Pressable
              onPress={handleRecoveryKey}
              disabled={!recoveryInput.trim()}
              style={[styles.actionBtn, {
                backgroundColor: recoveryInput.trim() ? colors.primary : colors.accent,
              }]}
            >
              <Text style={[styles.actionBtnText, {
                color: recoveryInput.trim() ? colors.primaryForeground : colors.mutedForeground,
              }]}>
                Verify Key
              </Text>
            </Pressable>
          </View>
        )}

        {step === 'new-pin' && (
          <View style={styles.pinSection}>
            <PinPad
              onComplete={handleNewPin}
              subtitle="Create a new 6-digit PIN"
            />
          </View>
        )}

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
  optionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  optionDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  recoverySection: { gap: 16 },
  sectionLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  recoveryInput: {
    height: 120, borderRadius: 14, borderWidth: 1, padding: 14,
    fontFamily: 'Inter_400Regular', fontSize: 15, textAlignVertical: 'top',
  },
  actionBtn: {
    height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  pinSection: { paddingTop: 20 },
});
