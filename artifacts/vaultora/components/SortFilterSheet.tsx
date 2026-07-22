import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import type { SortOption, FilterOption } from '@/contexts/VaultContext';

interface SortFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  sort: SortOption;
  filter: FilterOption;
  onSortChange: (s: SortOption) => void;
  onFilterChange: (f: FilterOption) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (v: 'grid' | 'list') => void;
}

export default function SortFilterSheet({
  visible, onClose, sort, filter, onSortChange, onFilterChange, viewMode, onViewModeChange,
}: SortFilterSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
    { value: 'addedDesc', label: t('sortFilter.newestFirst'), icon: 'time-outline' },
    { value: 'addedAsc', label: t('sortFilter.oldestFirst'), icon: 'time-outline' },
    { value: 'capturedDesc', label: t('sortFilter.dateTaken'), icon: 'calendar-outline' },
    { value: 'sizeDesc', label: t('sortFilter.sizeLargest'), icon: 'trending-down-outline' },
    { value: 'sizeAsc', label: t('sortFilter.sizeSmallest'), icon: 'trending-up-outline' },
    { value: 'nameAsc', label: t('sortFilter.nameAZ'), icon: 'text-outline' },
  ];

  const FILTER_OPTIONS: { value: FilterOption; label: string; icon: string }[] = [
    { value: 'all', label: t('sortFilter.all'), icon: 'grid-outline' },
    { value: 'photos', label: t('sortFilter.photos'), icon: 'image-outline' },
    { value: 'videos', label: t('sortFilter.videos'), icon: 'videocam-outline' },
    { value: 'favorites', label: t('sortFilter.favorites'), icon: 'heart-outline' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{t('sortFilter.view').toUpperCase()}</Text>
          <View style={[styles.viewToggle, { backgroundColor: colors.accent }]}>
            {(['grid', 'list'] as const).map(v => (
              <Pressable
                key={v}
                onPress={() => onViewModeChange(v)}
                style={[styles.viewBtn, viewMode === v && { backgroundColor: colors.card }]}
              >
                <Ionicons
                  name={v === 'grid' ? 'grid-outline' : 'list-outline'}
                  size={18}
                  color={viewMode === v ? colors.primary : colors.mutedForeground}
                />
                <Text style={[styles.viewBtnText, { color: viewMode === v ? colors.primary : colors.mutedForeground }]}>
                  {v === 'grid' ? t('sortFilter.grid') : t('sortFilter.list')}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{t('sortFilter.filter').toUpperCase()}</Text>
          {FILTER_OPTIONS.map(opt => (
            <Pressable
              key={opt.value}
              onPress={() => { onFilterChange(opt.value); onClose(); }}
              style={styles.option}
            >
              <Ionicons name={opt.icon as any} size={20} color={filter === opt.value ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.optionText, { color: filter === opt.value ? colors.primary : colors.foreground }]}>
                {opt.label}
              </Text>
              {filter === opt.value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
            </Pressable>
          ))}

          <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 8 }]}>{t('sortFilter.sort').toUpperCase()}</Text>
          {SORT_OPTIONS.map(opt => (
            <Pressable
              key={opt.value}
              onPress={() => { onSortChange(opt.value); onClose(); }}
              style={styles.option}
            >
              <Ionicons name={opt.icon as any} size={20} color={sort === opt.value ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.optionText, { color: sort === opt.value ? colors.primary : colors.foreground }]}>
                {opt.label}
              </Text>
              {sort === opt.value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 20 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginBottom: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  optionText: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  viewToggle: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 20 },
  viewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10 },
  viewBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
