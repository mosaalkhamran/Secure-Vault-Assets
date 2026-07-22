import React, { useState } from 'react';
import {
  Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import PinPad from '@/components/PinPad';
import StrengthMeter from '@/components/StrengthMeter';

type PinMode = 'numeric' | 'alphanumeric';

export default function CreatePinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [mode, setMode] = useState<PinMode>('numeric');
  const [alphaPin, setAlphaPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleNumericComplete = (pin: string) => {
    router.push({ pathname: '/onboarding/confirm-pin', params: { pin } });
  };

  const handleAlphaContinue = () => {
    if (alphaPin.length < 6) return;
    router.push({ pathname: '/onboarding/confirm-pin', params: { pin: alphaPin } });
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        {/* Step 2 of 3 */}
        <View style={styles.progress}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.dot, { backgroundColor: i <= 2 ? colors.primary : colors.border }]} />
          ))}
        </View>
        <View style={styles.backBtn} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.titleSection}>
          <View style={[styles.iconBg, { backgroundColor: 'rgba(196,151,90,0.15)' }]}>
            <Ionicons name="keypad-outline" size={32} color="#C4975A" />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{t('onboarding.createPin.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {mode === 'numeric' ? t('onboarding.createPin.subtitle') : t('onboarding.createPin.hint')}
          </Text>
        </View>

        {/* Mode toggle */}
        <View style={[styles.modeToggle, { backgroundColor: colors.accent }]}>
          {(['numeric', 'alphanumeric'] as PinMode[]).map(m => (
            <Pressable
              key={m}
              onPress={() => { setMode(m); setAlphaPin(''); }}
              style={[styles.modeBtn, mode === m && { backgroundColor: colors.card }]}
            >
              <Text style={[styles.modeBtnText, { color: mode === m ? colors.primary : colors.mutedForeground }]}>
                {m === 'numeric' ? t('onboarding.createPin.sixDigit') : t('onboarding.createPin.password')}
              </Text>
            </Pressable>
          ))}
        </View>

        {mode === 'numeric' ? (
          <PinPad onComplete={handleNumericComplete} />
        ) : (
          <View style={styles.alphaSection}>
            <View style={styles.inputWrapper}>
              <TextInput
                value={alphaPin}
                onChangeText={setAlphaPin}
                placeholder={t('onboarding.createPin.placeholder')}
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.alphaInput, {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.input,
                }]}
              />
              <Pressable onPress={() => setShowPassword(s => !s)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <StrengthMeter password={alphaPin} />

            {alphaPin.length > 0 && alphaPin.length < 6 && (
              <Text style={[styles.warning, { color: colors.destructive }]}>
                {t('onboarding.createPin.minLength')}
              </Text>
            )}

            <TouchableOpacity
              onPress={handleAlphaContinue}
              disabled={alphaPin.length < 6}
              style={[styles.continueBtn, {
                backgroundColor: alphaPin.length >= 6 ? colors.primary : colors.accent,
              }]}
            >
              <Text style={[styles.continueBtnText, {
                color: alphaPin.length >= 6 ? colors.primaryForeground : colors.mutedForeground,
              }]}>
                {t('onboarding.createPin.continueBtn')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* iCloud note */}
        <View style={[styles.icloudNote, { backgroundColor: 'rgba(94,158,250,0.08)', borderColor: 'rgba(94,158,250,0.2)' }]}>
          <Ionicons name="cloud-outline" size={14} color="#5E9EFA" />
          <Text style={[styles.icloudText, { color: '#5E9EFA' }]}>
            {t('onboarding.createPin.iCloudNote')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progress: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  content: { flex: 1, paddingHorizontal: 32, gap: 24, justifyContent: 'center' },
  titleSection: { alignItems: 'center', gap: 12 },
  iconBg: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  modeToggle: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  modeBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  alphaSection: { gap: 16 },
  inputWrapper: { position: 'relative' },
  alphaInput: { height: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingRight: 48, fontSize: 16, fontFamily: 'Inter_400Regular' },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  warning: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  continueBtn: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  continueBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  icloudNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  icloudText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
