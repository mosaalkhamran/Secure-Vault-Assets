import React from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface Props {
  visible: boolean;
  title: string;
  questions: string[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
  onClose: () => void;
  cancelLabel: string;
}

export default function QuestionPickerModal({
  visible, title, questions, selectedIdx, onSelect, onClose, cancelLabel,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Dim backdrop — tap to close */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Bottom sheet */}
      <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 8 }]}>
        {/* Handle bar */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Sheet header */}
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Question list */}
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        >
          {questions.map((q, i) => (
            <Pressable
              key={i}
              onPress={() => { onSelect(i); onClose(); }}
              style={({ pressed }) => [
                styles.option,
                { borderBottomColor: colors.border },
                i === selectedIdx && { backgroundColor: 'rgba(196,151,90,0.10)' },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: i === selectedIdx ? '#C4975A' : colors.foreground },
                ]}
              >
                {q}
              </Text>
              {i === selectedIdx && (
                <Ionicons name="checkmark" size={18} color="#C4975A" style={styles.check} />
              )}
            </Pressable>
          ))}
        </ScrollView>

        {/* Cancel button */}
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.cancelBtn, { borderTopColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>{cancelLabel}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', flex: 1 },
  closeBtn: { padding: 4 },
  list: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  optionText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  check: { flexShrink: 0 },
  cancelBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  cancelText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
});
