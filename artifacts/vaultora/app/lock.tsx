import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/contexts/VaultContext';
import PinPad from '@/components/PinPad';

export default function LockScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    verifyPin, authenticateWithFaceId, unlock,
    settings, isFaceIdAvailable,
    failedAttempts, lockUntil,
    recordFailedAttempt, resetFailedAttempts,
    verifyDecoyPin, enterDecoyMode, hasDecoyPin,
  } = useVault();

  const [error, setError] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const logoAnim = useRef(new Animated.Value(0)).current;
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if currently locked out
  const isLockedOut = lockUntil > Date.now();

  useEffect(() => {
    Animated.spring(logoAnim, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();

    if (settings.faceIdEnabled && isFaceIdAvailable && !isLockedOut) {
      setTimeout(() => handleFaceId(), 700);
    }
  }, []);

  // Countdown timer when locked out
  useEffect(() => {
    if (lockUntil <= Date.now()) {
      setCountdown(0);
      return;
    }
    const update = () => {
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setCountdown(0);
        if (countdownRef.current) clearInterval(countdownRef.current);
      } else {
        setCountdown(remaining);
      }
    };
    update();
    countdownRef.current = setInterval(update, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [lockUntil]);

  const handlePinComplete = useCallback(async (pin: string) => {
    if (isLockedOut || countdown > 0) return;
    const valid = await verifyPin(pin);
    if (valid) {
      await resetFailedAttempts();
      unlock();
      router.replace('/');
      return;
    }
    // Check decoy PIN (silent — no error shown, unlocks to empty vault)
    if (hasDecoyPin) {
      const isDecoy = await verifyDecoyPin(pin);
      if (isDecoy) {
        await resetFailedAttempts();
        enterDecoyMode();
        router.replace('/');
        return;
      }
    }
    await recordFailedAttempt();
    setError(true);
  }, [isLockedOut, countdown, hasDecoyPin]);

  const handleFaceId = useCallback(async () => {
    if (isLockedOut) return;
    const success = await authenticateWithFaceId();
    if (success) {
      await resetFailedAttempts();
      unlock();
      router.replace('/');
    }
  }, [isLockedOut]);

  const attemptsWarning = failedAttempts >= 3
    ? failedAttempts >= 5
      ? t('lock.failedAttempts_other', { count: failedAttempts })
      : t('lock.incorrectAttempts_other', { count: failedAttempts })
    : undefined;

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <LinearGradient
        colors={['rgba(196,151,90,0.08)', 'transparent']}
        style={styles.gradient}
      />

      <Animated.View
        style={[
          styles.logoSection,
          { paddingTop: insets.top + 60 },
          {
            opacity: logoAnim,
            transform: [{ scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
          },
        ]}
      >
        <View style={[styles.shieldContainer, { backgroundColor: 'rgba(196,151,90,0.15)', borderColor: 'rgba(196,151,90,0.3)' }]}>
          <Ionicons name="shield-checkmark" size={42} color="#C4975A" />
        </View>
        <Text style={styles.appName}>Vaultora</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>{t('lock.subtitle')}</Text>
      </Animated.View>

      {/* Locked-out state */}
      {countdown > 0 ? (
        <View style={styles.lockedOutSection}>
          <View style={[styles.lockedOutBox, { backgroundColor: colors.card, borderColor: 'rgba(224,85,85,0.3)' }]}>
            <Ionicons name="time-outline" size={28} color={colors.destructive} />
            <Text style={[styles.lockedOutTitle, { color: colors.destructive }]}>{t('lock.tooManyAttempts')}</Text>
            <Text style={[styles.lockedOutTimer, { color: colors.foreground }]}>
              {t('lock.tryAgain', { seconds: countdown })}
            </Text>
            <Text style={[styles.lockedOutHint, { color: colors.mutedForeground }]}>
              {t('lock.orUseFaceId')}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.padSection}>
          <PinPad
            onComplete={handlePinComplete}
            error={error}
            onErrorReset={() => setError(false)}
            onBiometric={handleFaceId}
            showBiometric={settings.faceIdEnabled && isFaceIdAvailable}
            subtitle={attemptsWarning}
          />
        </View>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={() => router.push('/forgot-pin')} style={styles.forgotBtn}>
          <Ionicons name="help-circle-outline" size={15} color={colors.mutedForeground} />
          <Text style={[styles.forgotText, { color: colors.mutedForeground }]}>{t('lock.forgotPin')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { ...StyleSheet.absoluteFillObject, bottom: '60%' },
  logoSection: { alignItems: 'center', gap: 12, paddingBottom: 24 },
  shieldContainer: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  appName: { fontSize: 32, fontFamily: 'Inter_700Bold', color: '#EDE8DF', letterSpacing: -0.5 },
  tagline: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  padSection: { flex: 1, paddingHorizontal: 32, justifyContent: 'center' },
  lockedOutSection: { flex: 1, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  lockedOutBox: { borderRadius: 20, padding: 28, alignItems: 'center', gap: 10, borderWidth: 1, width: '100%' },
  lockedOutTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  lockedOutTimer: { fontSize: 40, fontFamily: 'Inter_700Bold', letterSpacing: -1 },
  lockedOutHint: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  footer: { alignItems: 'center', paddingTop: 16 },
  forgotBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  forgotText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
