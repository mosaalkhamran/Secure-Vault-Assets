import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert, Dimensions, FlatList, Platform, Pressable,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import { useVault, VaultItem } from '@/contexts/VaultContext';

const { width: SW } = Dimensions.get('window');
const COLS = 3;
const GAP = 2;
const ITEM_SIZE = (SW - GAP * (COLS - 1)) / COLS;

const formatDur = (s: number) => {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
};

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { albums, vaultItems, softDelete, toggleFavorite, removeItemsFromAlbum, exportToPhotos } = useVault();

  const album = albums.find(a => a.id === id);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isSelecting = selectedIds.size > 0;

  const items = useMemo(() =>
    vaultItems.filter(i => album?.itemIds.includes(i.id)),
    [vaultItems, album]
  );

  const handleItemPress = useCallback((item: VaultItem) => {
    if (isSelecting) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.has(item.id) ? next.delete(item.id) : next.add(item.id);
        return next;
      });
    } else {
      router.push({ pathname: '/viewer', params: { id: item.id } });
    }
  }, [isSelecting]);

  const handleLongPress = useCallback((item: VaultItem) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedIds(new Set([item.id]));
  }, []);

  const handleRemoveSelected = async () => {
    const ids = Array.from(selectedIds);
    await removeItemsFromAlbum(ids, id!);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    Alert.alert(t('album.moveTitle'), t('album.moveMsg', { count: selectedIds.size }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('album.moveToTrash'), style: 'destructive',
        onPress: async () => {
          for (const itemId of selectedIds) await softDelete(itemId);
          setSelectedIds(new Set());
        },
      },
    ]);
  };

  const handleExportSelected = async () => {
    let count = 0;
    for (const itemId of selectedIds) {
      const ok = await exportToPhotos(itemId);
      if (ok) count++;
    }
    setSelectedIds(new Set());
    Alert.alert(t('album.exported'), t('album.exportedCount', { count }));
  };

  const handleFavoriteSelected = async () => {
    for (const itemId of selectedIds) await toggleFavorite(itemId);
    setSelectedIds(new Set());
  };

  if (!album) {
    return (
      <View style={[styles.container, { backgroundColor: '#0A0A12', alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: '#FFF', fontSize: 16 }}>{t('album.notFound')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => {
          if (isSelecting) setSelectedIds(new Set());
          else router.back();
        }} style={styles.backBtn}>
          <Ionicons name={isSelecting ? 'close' : 'chevron-back'} size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.albumName, { color: colors.foreground }]} numberOfLines={1}>
            {isSelecting ? t('album.selected', { count: selectedIds.size }) : album.name}
          </Text>
          {!isSelecting && (
            <Text style={[styles.itemCount, { color: colors.mutedForeground }]}>
              {items.length} {items.length === 1 ? t('album.item') : t('album.items')}
            </Text>
          )}
        </View>
        {isSelecting ? (
          <Pressable onPress={() => setSelectedIds(new Set(items.map(i => i.id)))} style={styles.backBtn}>
            <Text style={[{ color: colors.primary, fontSize: 15, fontFamily: 'Inter_500Medium' }]}>{t('common.all')}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Grid */}
      {items.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
            <Ionicons name="images-outline" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('album.empty')}</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            {t('album.emptyDesc')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          numColumns={COLS}
          columnWrapperStyle={styles.gridRow}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item, index }) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <TouchableOpacity
                onPress={() => handleItemPress(item)}
                onLongPress={() => handleLongPress(item)}
                activeOpacity={0.85}
                style={{ width: ITEM_SIZE, height: ITEM_SIZE, marginLeft: index % COLS === 0 ? 0 : GAP, backgroundColor: colors.accent }}
              >
                <Image source={{ uri: item.fileUri }} style={styles.gridImage} contentFit="cover" transition={150} />
                {item.type === 'video' && (
                  <View style={styles.videoOverlay}>
                    <Ionicons name="play-circle" size={24} color="rgba(255,255,255,0.9)" />
                    {item.duration != null && <Text style={styles.duration}>{formatDur(item.duration)}</Text>}
                  </View>
                )}
                {item.isFavorite && <Ionicons name="heart" size={12} color="#E05555" style={styles.favIcon} />}
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
        />
      )}

      {/* Multi-select toolbar */}
      {isSelecting && (
        <View style={[styles.toolbar, { backgroundColor: colors.card, paddingBottom: insets.bottom + 8 }]}>
          <ToolbarBtn icon="heart-outline" label={t('album.favorite')} onPress={handleFavoriteSelected} color={colors.primary} />
          <ToolbarBtn icon="arrow-undo-outline" label={t('album.remove')} onPress={handleRemoveSelected} color={colors.foreground} />
          <ToolbarBtn icon="share-outline" label={t('album.export')} onPress={handleExportSelected} color={colors.foreground} />
          <ToolbarBtn icon="trash-outline" label={t('album.delete')} onPress={handleDeleteSelected} color={colors.destructive} />
        </View>
      )}
    </View>
  );
}

function ToolbarBtn({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.toolbarBtn}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[styles.toolbarLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingBottom: 12, gap: 4,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  albumName: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  itemCount: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  gridRow: { gap: GAP },
  gridImage: { width: '100%', height: '100%' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 2 },
  duration: { color: '#FFF', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  favIcon: { position: 'absolute', bottom: 4, right: 4 },
  selectedOverlay: { ...StyleSheet.absoluteFillObject, borderWidth: 2.5, backgroundColor: 'rgba(196,151,90,0.2)' },
  checkmark: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  toolbarBtn: { alignItems: 'center', gap: 4, paddingHorizontal: 12 },
  toolbarLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold' },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
});
