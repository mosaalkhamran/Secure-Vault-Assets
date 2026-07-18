import React, { useState } from 'react';
import {
  Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useColors } from '@/hooks/useColors';
import { useVault, generateRecoveryKey } from '@/contexts/VaultContext';

const VERIFY_COUNT = 3;

export default function RecoveryKeyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { storeRecoveryKey, completeSetup, unlock } = useVault();
  const [recoveryKey] = useState(() => generateRecoveryKey());
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyAnswers, setVerifyAnswers] = useState<Record<number, string>>({});
  const [verifyError, setVerifyError] = useState(false);

  const words = recoveryKey.split(' ');

  // Pick 3 random word positions to verify
  const [verifyIndices] = useState<number[]>(() => {
    const indices: number[] = [];
    while (indices.length < VERIFY_COUNT) {
      const n = Math.floor(Math.random() * 24);
      if (!indices.includes(n)) indices.push(n);
    }
    return indices.sort((a, b) => a - b);
  });

  const handleCopy = async () => {
    await Clipboard.setStringAsync(recoveryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleConfirmSaved = () => {
    if (!confirmed) {
      Alert.alert('Have you saved your recovery key?', 'Make sure it is written down or stored in a password manager before continuing.', [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, I saved it',
          onPress: () => { setConfirmed(true); setShowVerify(true); },
        },
      ]);
    }
  };

  const handleVerify = async () => {
    const allCorrect = verifyIndices.every(
      i => (verifyAnswers[i] ?? '').trim().toLowerCase() === words[i].toLowerCase()
    );
    if (allCorrect) {
      await storeRecoveryKey(recoveryKey);
      await completeSetup();
      unlock();
      router.replace('/');
    } else {
      setVerifyError(true);
      setVerifyAnswers({});
      Alert.alert('Incorrect', 'Some words do not match. Please check your recovery key and try again.');
    }
  };

  const verifyComplete = verifyIndices.every(i => (verifyAnswers[i] ?? '').trim().length > 0);

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => { if (showVerify) setShowVerify(false); else router.back(); }} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.progress}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.dot, { backgroundColor: i <= 3 ? colors.primary : colors.border }]} />
          ))}
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {!showVerify ? (
          <>
            {/* Title */}
            <View style={styles.titleSection}>
              <View style={[styles.iconBg, { backgroundColor: 'rgba(245,166,35,0.15)' }]}>
                <Ionicons name="key-outline" size={32} color="#F5A623" />
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>Your Recovery Key</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                These 24 words are the only way to recover your vault if you lose your PIN and Face ID is unavailable. Store them safely.
              </Text>
            </View>

            {/* Key display */}
            <View style={[styles.keyCard, { backgroundColor: colors.card, borderColor: 'rgba(245,166,35,0.3)' }]}>
              <View style={styles.wordsGrid}>
                {words.map((word, i) => (
                  <View key={i} style={[styles.wordItem, { backgroundColor: 'rgba(245,166,35,0.08)' }]}>
                    <Text style={[styles.wordNum, { color: '#F5A623' }]}>{i + 1}</Text>
                    <Text style={[styles.word, { color: colors.foreground }]}>{word}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                onPress={handleCopy}
                style={[styles.copyBtn, { borderColor: colors.border, backgroundColor: colors.accent }]}
              >
                <Ionicons
                  name={copied ? 'checkmark-circle-outline' : 'copy-outline'}
                  size={16}
                  color={copied ? '#4CAF87' : colors.mutedForeground}
                />
                <Text style={[styles.copyText, { color: copied ? '#4CAF87' : colors.mutedForeground }]}>
                  {copied ? 'Copied to clipboard' : 'Copy all words'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Warning */}
            <View style={[styles.warning, { backgroundColor: 'rgba(245,166,35,0.08)', borderColor: 'rgba(245,166,35,0.3)' }]}>
              <Ionicons name="warning-outline" size={18} color="#F5A623" />
              <Text style={[styles.warningText, { color: '#F5A623' }]}>
                Do not screenshot this key and store it in your Photos app. The developer cannot recover it for you.
              </Text>
            </View>

            {/* CTA */}
            <Pressable
              onPress={handleConfirmSaved}
              style={({ pressed }) => [styles.continueBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={[styles.continueBtnText, { color: colors.primaryForeground }]}>
                I've saved my key → Verify it
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            {/* Verification step */}
            <View style={styles.titleSection}>
              <View style={[styles.iconBg, { backgroundColor: 'rgba(76,175,135,0.15)' }]}>
                <Ionicons name="checkmark-shield-outline" size={32} color="#4CAF87" />
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>Verify Your Key</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Enter the words at positions {verifyIndices.map(i => i + 1).join(', ')} to confirm you have your key.
              </Text>
            </View>

            <View style={[styles.verifyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {verifyIndices.map(idx => (
                <View key={idx} style={styles.verifyRow}>
                  <View style={[styles.verifyNum, { backgroundColor: 'rgba(76,175,135,0.15)' }]}>
                    <Text style={[styles.verifyNumText, { color: '#4CAF87' }]}>{idx + 1}</Text>
                  </View>
                  <TextInput
                    value={verifyAnswers[idx] ?? ''}
                    onChangeText={v => setVerifyAnswers(prev => ({ ...prev, [idx]: v }))}
                    placeholder={`Word #${idx + 1}`}
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.verifyInput, {
                      color: colors.foreground,
                      borderColor: verifyError ? colors.destructive : colors.border,
                      backgroundColor: colors.input,
                    }]}
                    returnKeyType="next"
                  />
                </View>
              ))}
            </View>

            <Pressable
              onPress={handleVerify}
              disabled={!verifyComplete}
              style={({ pressed }) => [styles.continueBtn, {
                backgroundColor: verifyComplete ? '#4CAF87' : colors.accent,
                opacity: pressed ? 0.85 : 1,
              }]}
            >
              <Text style={[styles.continueBtnText, {
                color: verifyComplete ? '#FFF' : colors.mutedForeground,
              }]}>
                {verifyComplete ? 'Open My Vault →' : 'Enter all words to continue'}
              </Text>
            </Pressable>

            <Pressable onPress={() => setShowVerify(false)} style={{ alignItems: 'center' }}>
              <Text style={[styles.backText, { color: colors.mutedForeground }]}>← Back to recovery key</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progress: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  content: { paddingHorizontal: 24, gap: 20 },
  titleSection: { alignItems: 'center', gap: 12, paddingTop: 8 },
  iconBg: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  keyCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, padding: 16, gap: 16 },
  wordsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  wordItem: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, minWidth: '30%' },
  wordNum: { fontSize: 10, fontFamily: 'Inter_700Bold', minWidth: 16 },
  word: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  copyText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  warning: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  warningText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  continueBtn: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  continueBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  verifyCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 12 },
  verifyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  verifyNum: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  verifyNumText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  verifyInput: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontFamily: 'Inter_400Regular', fontSize: 15 },
  backText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
