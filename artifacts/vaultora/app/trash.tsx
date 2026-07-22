import React, { useState } from 'react';
import {
  Alert, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import { useVault, VaultItem } from '@/contexts/VaultContext';

export default function TrashScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { trashedItems, restoreFromTrash, permanentDelete, emptyTrash, settings } = useVault();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isSelecting = selectedIds.size > 0;

  const getDaysLeft = (item: VaultItem) => {
    if (!item.deletedAt) return settings.trashRetentionDays;
    const deletedMs = new Date(item.deletedAt).getTime();
    const expiresMs = deletedMs + settings.trashRetentionDays * 24 * 60 * 60 * 1000;
    const daysLeft = Math.ceil((expiresMs - Date.now()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysLeft);
  };

  const handleItemPress = (item: VaultItem) => {
    if (isSelecting) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
    } else {
      router.push({ pathname: '/viewer', params: { id: item.id, source: 'trash' } });
    }
  };

  const handleLongPress = (item: VaultItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedIds(new Set([item.id]));
  };

  const handleEmptyTrash = () => {
    Alert.alert(
      t('trash.confirmEmptyTitle'),
      t('trash.confirmEmptyMsg', { count: trashedItems.length }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('trash.deleteAll'), style: 'destructive', onPress: () => emptyTrash() },
      ]
    );
  };

  const handleRestoreSelected = async () => {
    for (const id of selectedIds) await restoreFromTrash(id);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      t('trash.confirmDeleteTitle'),
      t('trash.confirmDeleteMsg', { count: selectedIds.size }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            for (const id of selectedIds) await permanentDelete(id);
            setSelectedIds(new Set());
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {isSelecting ? t('trash.selected', { count: selectedIds.size }) : t('trash.title')}
        </Text>
        {isSelecting ? (
          <Pressable onPress={() => setSelectedIds(new Set())} style={styles.headerBtn}>
            <Text style={[styles.doneText, { color: colors.primary }]}>{t('trash.done')}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={handleEmptyTrash} style={styles.headerBtn} disabled={trashedItems.length === 0}>
            <Text style={[styles.emptyText, { color: trashedItems.length > 0 ? colors.destructive : colors.mutedForeground }]}>
              {t('trash.emptyTrash')}
            </Text>
          </Pressable>
        )}
      </View>

      {trashedItems.length > 0 && !isSelecting && (
        <View style={[styles.infoBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            {t('trash.retentionNote', { days: settings.trashRetentionDays })}
          </Text>
        </View>
      )}

      <FlatList
        data={trashedItems}
        keyExtractor={i => i.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const isSelected = selectedIds.has(item.id);
          const daysLeft = getDaysLeft(item);
          const marginLeft = index % 3 === 0 ? 0 : 2;
          const itemSize = (require('react-native').Dimensions.get('window').width - 4) / 3;
          return (
            <TouchableOpacity
              onPress={() => handleItemPress(item)}
              onLongPress={() => handleLongPress(item)}
              activeOpacity={0.85}
              style={{ width: itemSize, height: itemSize, marginLeft, position: 'relative' }}
            >
              <Image
                source={{ uri: item.fileUri }}
                style={{ width: '100%', height: '100%', backgroundColor: colors.accent }}
                contentFit="cover"
              />
              {item.type === 'video' && (
                <View style={styles.videoTag}>
                  <Ionicons name="play" size={10} color="#FFF" />
                </View>
              )}
              <View style={styles.daysTag}>
                <Text style={styles.daysText}>{daysLeft}d</Text>
              </View>
              {isSelected && (
                <View style={[styles.selectedOverlay, { borderColor: colors.primary }]}>
                  <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark" size={12} color={colors.primaryForeground} />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="trash-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('trash.empty')}</Text>
            <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
              {t('trash.emptyDesc', { days: settings.trashRetentionDays })}
            </Text>
          </View>
        }
      />

      {isSelecting && (
        <View style={[styles.selectionBar, { backgroundColor: colors.card, paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity onPress={handleRestoreSelected} style={styles.selBtn}>
            <Ionicons name="arrow-undo-outline" size={22} color={colors.primary} />
            <Text style={[styles.selBtnText, { color: colors.primary }]}>{t('trash.restore')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteSelected} style={styles.selBtn}>
            <Ionicons name="trash-outline" size={22} color={colors.destructive} />
            <Text style={[styles.selBtnText, { color: colors.destructive }]}>{t('trash.delete')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 8 },
  headerBtn: { width: 60, padding: 8, alignItems: 'center' },
  title: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  doneText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  emptyText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  infoBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, padding: 10, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  infoText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  list: { paddingBottom: 100 },
  row: { gap: 2 },
  videoTag: { position: 'absolute', top: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: 2 },
  daysTag: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  daysText: { color: '#FFF', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  selectedOverlay: { ...StyleSheet.absoluteFillObject, borderWidth: 2.5, backgroundColor: 'rgba(196,151,90,0.25)' },
  checkmark: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold' },
  emptyHint: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  selectionBar: { flexDirection: 'row', justifyContent: 'space-around', padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
  selBtn: { alignItems: 'center', gap: 4 },
  selBtnText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});
