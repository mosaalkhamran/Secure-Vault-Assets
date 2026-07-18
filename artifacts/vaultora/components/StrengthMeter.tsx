import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export type StrengthLevel = 'empty' | 'weak' | 'fair' | 'strong' | 'very-strong';

export function getStrength(password: string): StrengthLevel {
  if (!password) return 'empty';
  const len = password.length;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const variety = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;

  if (len < 6) return 'weak';
  if (len < 8 || variety < 2) return 'weak';
  if (len < 10 || variety < 3) return 'fair';
  if (len < 14 || variety < 4) return 'strong';
  return 'very-strong';
}

const LABELS: Record<StrengthLevel, string> = {
  empty: '',
  weak: 'Weak',
  fair: 'Fair',
  strong: 'Strong',
  'very-strong': 'Very Strong',
};

const COLORS: Record<StrengthLevel, string> = {
  empty: 'transparent',
  weak: '#E05555',
  fair: '#F5A623',
  strong: '#4CAF87',
  'very-strong': '#00C853',
};

const SEGMENTS: Record<StrengthLevel, number> = {
  empty: 0,
  weak: 1,
  fair: 2,
  strong: 3,
  'very-strong': 4,
};

interface StrengthMeterProps {
  password: string;
}

export default function StrengthMeter({ password }: StrengthMeterProps) {
  const colors = useColors();
  const level = getStrength(password);
  const filled = SEGMENTS[level];
  const color = COLORS[level];
  const label = LABELS[level];

  if (!password) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {[1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[
              styles.bar,
              { backgroundColor: i <= filled ? color : colors.border },
            ]}
          />
        ))}
      </View>
      {label ? (
        <Text style={[styles.label, { color }]}>{label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bars: { flex: 1, flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium', minWidth: 68, textAlign: 'right' },
});
