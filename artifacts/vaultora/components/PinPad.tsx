import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Platform, Pressable, StyleSheet, Text, View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface PinPadProps {
  onComplete: (pin: string) => void;
  maxLength?: number;
  error?: boolean;
  onErrorReset?: () => void;
  onBiometric?: () => void;
  showBiometric?: boolean;
  subtitle?: string;
  disabled?: boolean;
}

const PIN_LENGTH = 6;

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['biometric', '0', 'del'],
];

export default function PinPad({
  onComplete,
  maxLength = PIN_LENGTH,
  error = false,
  onErrorReset,
  onBiometric,
  showBiometric = false,
  subtitle,
  disabled = false,
}: PinPadProps) {
  const colors = useColors();
  const [pin, setPin] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start(() => {
        setPin('');
        onErrorReset?.();
      });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [error]);

  const handleKey = useCallback((key: string) => {
    if (disabled) return;
    if (key === 'del') {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPin(p => p.slice(0, -1));
    } else if (key === 'biometric') {
      onBiometric?.();
    } else {
      if (pin.length >= maxLength) return;
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === maxLength) {
        setTimeout(() => onComplete(newPin), 100);
      }
    }
  }, [pin, maxLength, disabled, onBiometric, onComplete]);

  const dotColor = error ? colors.destructive : colors.primary;

  return (
    <View style={styles.container}>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      )}
      {/* PIN Dots */}
      <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < pin.length ? dotColor : 'transparent',
                borderColor: i < pin.length ? dotColor : colors.border,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map(key => (
              <PinKey
                key={key}
                keyValue={key}
                onPress={handleKey}
                showBiometric={showBiometric}
                colors={colors}
                disabled={disabled}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

interface PinKeyProps {
  keyValue: string;
  onPress: (key: string) => void;
  showBiometric: boolean;
  colors: ReturnType<typeof useColors>;
  disabled: boolean;
}

function PinKey({ keyValue, onPress, showBiometric, colors, disabled }: PinKeyProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, speed: 60 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 60 }).start();
  };

  if (keyValue === 'biometric' && !showBiometric) {
    return <View style={styles.keyPlaceholder} />;
  }

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onPress(keyValue)}
      disabled={disabled}
      style={({ pressed }) => [styles.keyWrapper, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Animated.View
        style={[
          styles.key,
          {
            backgroundColor: keyValue === 'del' || keyValue === 'biometric'
              ? 'transparent'
              : 'rgba(255,255,255,0.08)',
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {keyValue === 'del' ? (
          <Ionicons name="backspace-outline" size={24} color={colors.foreground} />
        ) : keyValue === 'biometric' ? (
          <Ionicons name="scan-outline" size={26} color={colors.primary} />
        ) : (
          <Text style={[styles.keyText, { color: colors.foreground }]}>{keyValue}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 48,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  keypad: {
    width: '100%',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  keyWrapper: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  key: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPlaceholder: {
    width: 76,
    height: 76,
  },
  keyText: {
    fontSize: 28,
    fontFamily: 'Inter_400Regular',
    fontWeight: '300' as const,
  },
});
