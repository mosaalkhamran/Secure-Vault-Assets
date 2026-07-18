import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Platform, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/contexts/VaultContext';
import PinPad from '@/components/PinPad';

export default function LockScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { verifyPin, authenticateWithFaceId, unlock, settings, isFaceIdAvailable } = useVault();
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(logoAnim, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Auto-trigger Face ID if enabled
    if (settings.faceIdEnabled && isFaceIdAvailable) {
      setTimeout(() => handleFaceId(), 600);
    }
  }, []);

  const handlePinComplete = async (pin: string) => {
    const valid = await verifyPin(pin);
    if (valid) {
      unlock();
      router.replace('/');
    } else {
      setError(true);
      setAttempts(a => a + 1);
    }
  };

  const handleFaceId = async () => {
    const success = await authenticateWithFaceId();
    if (success) {
      unlock();
      router.replace('/');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <LinearGradient
        colors={['rgba(196,151,90,0.08)', 'transparent']}
        style={styles.gradient}
      />

      {/* Logo area */}
      <Animated.View
        style={[
          styles.logoSection,
          { paddingTop: insets.top + 60 },
          {
            opacity: logoAnim,
            transform: [{ scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
          },
        ]}
      >
        <View style={[styles.shieldContainer, { backgroundColor: 'rgba(196,151,90,0.15)', borderColor: 'rgba(196,151,90,0.3)' }]}>
          <Ionicons name="shield-checkmark" size={42} color="#C4975A" />
        </View>
        <Text style={styles.appName}>Vaultora</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Your private vault</Text>
      </Animated.View>

      {/* Pin Pad */}
      <View style={styles.padSection}>
        <PinPad
          onComplete={handlePinComplete}
          error={error}
          onErrorReset={() => setError(false)}
          onBiometric={handleFaceId}
          showBiometric={settings.faceIdEnabled && isFaceIdAvailable}
          subtitle={attempts >= 3 ? `${attempts} failed attempts` : undefined}
        />
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={() => router.push('/forgot-pin')}>
          <Text style={[styles.forgotText, { color: colors.mutedForeground }]}>Forgot PIN?</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    bottom: '60%',
  },
  logoSection: {
    alignItems: 'center',
    gap: 12,
    paddingBottom: 40,
  },
  shieldContainer: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  appName: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: '#EDE8DF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  padSection: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
