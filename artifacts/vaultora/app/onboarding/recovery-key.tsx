import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useColors } from '@/hooks/useColors';
import { useVault, generateRecoveryKey } from '@/contexts/VaultContext';

export default function RecoveryKeyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { storeRecoveryKey, completeSetup, unlock } = useVault();
  const [recoveryKey] = useState(() => generateRecoveryKey());
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const words = recoveryKey.split(' ');

  const handleCopy = async () => {
    await Clipboard.setStringAsync(recoveryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleConfirm = async () => {
    if (!confirmed) {
      Alert.alert('Confirm', 'Have you saved your recovery key in a safe place?', [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Yes, saved it', onPress: () => setConfirmed(true) },
      ]);
      return;
    }
    await storeRecoveryKey(recoveryKey);
    await completeSetup();
    unlock();
    router.replace('/');
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
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
        <View style={styles.titleSection}>
          <View style={[styles.iconBg, { backgroundColor: 'rgba(245,166,35,0.15)' }]}>
            <Ionicons name="key-outline" size={32} color="#F5A623" />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Recovery Key</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Save these 12 words. This is your only way to recover your vault if you forget your PIN and Face ID is unavailable.
          </Text>
        </View>

        {/* Key display */}
        <View style={[styles.keyCard, { backgroundColor: colors.card, borderColor: '#F5A62340' }]}>
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
              {copied ? 'Copied' : 'Copy to clipboard'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Warning */}
        <View style={[styles.warning, { backgroundColor: 'rgba(245,166,35,0.08)', borderColor: 'rgba(245,166,35,0.3)' }]}>
          <Ionicons name="warning-outline" size={18} color="#F5A623" />
          <Text style={[styles.warningText, { color: '#F5A623' }]}>
            This key is only shown once. The developer cannot recover it for you. Keep it private and secure.
          </Text>
        </View>

        {/* Confirm toggle */}
        <Pressable
          onPress={() => setConfirmed(!confirmed)}
          style={styles.checkRow}
        >
          <View style={[styles.checkbox, {
            backgroundColor: confirmed ? colors.primary : 'transparent',
            borderColor: confirmed ? colors.primary : colors.border,
          }]}>
            {confirmed && <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />}
          </View>
          <Text style={[styles.checkText, { color: colors.foreground }]}>
            I have saved my recovery key in a safe place
          </Text>
        </Pressable>

        {/* CTA */}
        <Pressable
          onPress={handleConfirm}
          style={({ pressed }) => [styles.continueBtn, {
            backgroundColor: confirmed ? colors.primary : colors.accent,
            opacity: pressed ? 0.85 : 1,
          }]}
        >
          <Text style={[styles.continueBtnText, {
            color: confirmed ? colors.primaryForeground : colors.mutedForeground,
          }]}>
            {confirmed ? 'Open My Vault' : 'Save Key First'}
          </Text>
          {confirmed && <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />}
        </Pressable>
      </ScrollView>
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
  content: { paddingHorizontal: 24, gap: 20 },
  titleSection: { alignItems: 'center', gap: 12, paddingTop: 8 },
  iconBg: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  keyCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, padding: 16, gap: 16 },
  wordsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wordItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, minWidth: '30%',
  },
  wordNum: { fontSize: 11, fontFamily: 'Inter_600SemiBold', minWidth: 14 },
  word: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 10, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth,
  },
  copyText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  warning: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  warningText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  checkText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  continueBtn: {
    height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  continueBtnText: { fontSize: 17, fontFamily: 'Inter_700Bold' },
});
