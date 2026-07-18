import React, { useState } from 'react';
import {
  Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import PinPad from '@/components/PinPad';
import StrengthMeter from '@/components/StrengthMeter';

type PinMode = 'numeric' | 'alphanumeric';

export default function CreatePinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
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
        <View style={styles.progress}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.dot, { backgroundColor: i === 1 ? colors.primary : colors.border }]} />
          ))}
        </View>
        <View style={styles.backBtn} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.titleSection}>
          <View style={[styles.iconBg, { backgroundColor: 'rgba(196,151,90,0.15)' }]}>
            <Ionicons name="keypad-outline" size={32} color="#C4975A" />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Create Your PIN</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {mode === 'numeric'
              ? 'Choose a 6-digit PIN to secure your vault'
              : 'Choose a strong alphanumeric password (min. 6 characters)'}
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
                {m === 'numeric' ? '6-Digit PIN' : 'Password'}
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
                placeholder="Enter password"
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
                Password must be at least 6 characters
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
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          You can recover access via Face ID or your recovery key if you forget.
        </Text>
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
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
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
  hint: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },
});
