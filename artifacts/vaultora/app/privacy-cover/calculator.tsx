import React, { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useVault } from '@/contexts/VaultContext';

// Full working calculator that secretly unlocks vault when PIN is entered then =
const BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

type CalcOp = '+' | '−' | '×' | '÷' | null;

export default function CalculatorCover() {
  const insets = useSafeAreaInsets();
  const { verifyPin, unlock, resetFailedAttempts, recordFailedAttempt } = useVault();
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null);
  const [op, setOp] = useState<CalcOp>(null);
  const [pinInput, setPinInput] = useState('');
  const [freshInput, setFreshInput] = useState(true);

  const tap = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDigit = useCallback((digit: string) => {
    tap();
    const next = freshInput ? digit : (display === '0' ? digit : display + digit);
    setDisplay(next.length > 9 ? next.slice(0, 9) : next);
    setFreshInput(false);
    setPinInput(prev => (freshInput ? digit : prev + digit));
  }, [display, freshInput]);

  const handleDecimal = useCallback(() => {
    tap();
    if (display.includes('.')) return;
    setDisplay(display + '.');
    setFreshInput(false);
    setPinInput(prev => prev + '.');
  }, [display]);

  const handleClear = useCallback(() => {
    tap();
    setDisplay('0');
    setStored(null);
    setOp(null);
    setPinInput('');
    setFreshInput(true);
  }, []);

  const handleSign = useCallback(() => {
    tap();
    const val = parseFloat(display);
    setDisplay(String(-val));
  }, [display]);

  const handlePercent = useCallback(() => {
    tap();
    const val = parseFloat(display) / 100;
    setDisplay(String(val));
  }, [display]);

  const handleOperator = useCallback((operator: CalcOp) => {
    tap();
    const val = parseFloat(display);
    if (stored !== null && op && !freshInput) {
      const result = calculate(stored, val, op);
      setDisplay(String(result));
      setStored(result);
    } else {
      setStored(val);
    }
    setOp(operator);
    setFreshInput(true);
    setPinInput('');
  }, [display, stored, op, freshInput]);

  const handleEquals = useCallback(async () => {
    tap();
    const pin = pinInput.replace(/[^0-9]/g, '');
    if (pin.length >= 4) {
      const valid = await verifyPin(pin);
      if (valid) {
        await resetFailedAttempts();
        unlock();
        router.replace('/');
        return;
      } else {
        await recordFailedAttempt();
        // Fall through to show normal calculation result
      }
    }
    // Normal calculation
    if (stored !== null && op) {
      const val = parseFloat(display);
      const result = calculate(stored, val, op);
      const resultStr = String(parseFloat(result.toFixed(9)));
      setDisplay(resultStr.length > 12 ? result.toExponential(4) : resultStr);
      setStored(null);
      setOp(null);
      setFreshInput(true);
      setPinInput('');
    }
  }, [display, stored, op, pinInput]);

  const calculate = (a: number, b: number, operator: CalcOp): number => {
    switch (operator) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleButton = useCallback((btn: string) => {
    if (btn === 'C') return handleClear();
    if (btn === '±') return handleSign();
    if (btn === '%') return handlePercent();
    if (btn === '.') return handleDecimal();
    if (btn === '=') return handleEquals();
    if (['+', '−', '×', '÷'].includes(btn)) return handleOperator(btn as CalcOp);
    handleDigit(btn);
  }, [handleClear, handleSign, handlePercent, handleDecimal, handleEquals, handleOperator, handleDigit]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Display */}
      <View style={styles.displayArea}>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
        {op && (
          <Text style={styles.opIndicator}>{op}</Text>
        )}
      </View>

      {/* Buttons */}
      <View style={[styles.buttonGrid, { paddingBottom: insets.bottom + 8 }]}>
        {BUTTONS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((btn) => (
              <CalcButton
                key={btn}
                label={btn}
                onPress={() => handleButton(btn)}
                type={
                  ['÷', '×', '−', '+', '='].includes(btn)
                    ? 'operator'
                    : ['C', '±', '%'].includes(btn)
                    ? 'function'
                    : btn === '0'
                    ? 'zero'
                    : 'digit'
                }
                activeOp={op === btn}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function CalcButton({ label, onPress, type, activeOp }: {
  label: string;
  onPress: () => void;
  type: 'digit' | 'operator' | 'function' | 'zero';
  activeOp: boolean;
}) {
  const bgColor =
    type === 'operator' ? (activeOp ? '#FFF' : '#FF9F0A') :
    type === 'function' ? '#636366' : '#1C1C1E';
  const textColor =
    type === 'operator' ? (activeOp ? '#FF9F0A' : '#FFF') :
    type === 'function' ? '#FFF' : '#FFF';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        type === 'zero' && styles.zeroButton,
        { backgroundColor: pressed ? `${bgColor}CC` : bgColor },
      ]}
    >
      <Text style={[styles.buttonText, { color: textColor }, type === 'zero' && styles.zeroText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const BTN = 80;
const GAP = 12;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'flex-end' },
  displayArea: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    minHeight: 120,
  },
  displayText: {
    fontSize: 70,
    color: '#FFF',
    fontWeight: '200',
    textAlign: 'right',
    fontFamily: 'Inter_400Regular',
  },
  opIndicator: {
    position: 'absolute',
    top: 16,
    right: 24,
    fontSize: 22,
    color: '#FF9F0A',
  },
  buttonGrid: { paddingHorizontal: 16, gap: GAP },
  row: { flexDirection: 'row', gap: GAP, justifyContent: 'center' },
  button: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zeroButton: { width: BTN * 2 + GAP, borderRadius: BTN / 2, paddingLeft: BTN / 2 - 4, alignItems: 'flex-start' },
  buttonText: { fontSize: 28, fontFamily: 'Inter_400Regular' },
  zeroText: { fontSize: 28 },
});
