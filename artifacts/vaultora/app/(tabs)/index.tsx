import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert, Dimensions, FlatList, Platform, Pressable, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import { useVault, VaultItem, SortOption, FilterOption } from '@/contexts/VaultContext';
import SortFilterSheet from '@/components/SortFilterSheet';
import ImportSheet from '@/components/ImportSheet';
import AlbumPickerSheet from '@/components/AlbumPickerSheet';

const { width: SW } = Dimensions.get('window');
const COLS = 3;
const GAP = 2;
const ITEM_SIZE = (SW - GAP * (COLS - 1)) / COLS;

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { vaultItems, trashedItems, softDelete, toggleFavorite, lock, exportToPhotos, addItemsToAlbum } = useVault();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sort, setSort] = useState<SortOption>('addedDesc');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSortFilter, setShowSortFilter] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isSelecting = selectedIds.size > 0;

  // Filter
  const filtered = useMemo(() => {
    let items = vaultItems;
    if (filter === 'photos') items = items.filter(i => i.type === 'photo');
    else if (filter === 'videos') items = items.filter(i => i.type === 'video');
    else if (filter === 'favorites') items = items.filter(i => i.isFavorite);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i =>
        i.fileName.toLowerCase().includes(q) ||
        i.originalName?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [vaultItems, filter, searchQuery]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'addedAsc': return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
        case 'addedDesc': return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case 'sizeDesc': return b.size - a.size;
        case 'sizeAsc': return a.size - b.size;
        case 'nameAsc': return a.fileName.localeCompare(b.fileName);
        case 'capturedDesc': return new Date(b.capturedAt ?? b.addedAt).getTime() - new Date(a.capturedAt ?? a.addedAt).getTime();
        default: return 0;
      }
    });
  }, [filtered, sort]);

  const handleItemPress = useCallback((item: VaultItem) => {
    if (isSelecting) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
    } else {
      const idx = sorted.findIndex(i => i.id === item.id);
      router.push({ pathname: '/viewer', params: { id: item.id } });
    }
  }, [isSelecting, sorted]);

  const handleLongPress = useCallback((item: VaultItem) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedIds(new Set([item.id]));
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    for (const id of selectedIds) await softDelete(id);
    setSelectedIds(new Set());
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [selectedIds, softDelete]);

  const handleFavoriteSelected = useCallback(async () => {
    for (const id of selectedIds) await toggleFavorite(id);
    setSelectedIds(new Set());
  }, [selectedIds, toggleFavorite]);

  const handleExportSelected = useCallback(async () => {
    let count = 0;
    for (const id of selectedIds) {
      const ok = await exportToPhotos(id);
      if (ok) count++;
    }
    setSelectedIds(new Set());
    if (count > 0) Alert.alert(t('vault.exported'), t('vault.exportedCount', { count }));
    else Alert.alert(t('vault.exportFailed'), t('vault.exportFailedDesc'));
  }, [selectedIds, exportToPhotos]);

  const handleMoveToAlbum = useCallback(async (albumId: string) => {
    await addItemsToAlbum(Array.from(selectedIds), albumId);
    setSelectedIds(new Set());
  }, [selectedIds, addItemsToAlbum]);

  const handleSelectAll = () => setSelectedIds(new Set(sorted.map(i => i.id)));

  const photoCount = vaultItems.filter(i => i.type === 'photo').length;
  const videoCount = vaultItems.filter(i => i.type === 'video').length;
  const totalSizeBytes = vaultItems.reduce((s, i) => s + i.size, 0);

  const formatStorageSize = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const renderGridItem = useCallback(({ item, index }: { item: VaultItem; index: number }) => {
    const isSelected = selectedIds.has(item.id);
    const ml = index % COLS === 0 ? 0 : GAP;
    return (
      <TouchableOpacity
        onPress={() => handleItemPress(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.85}
        style={{ width: ITEM_SIZE, height: ITEM_SIZE, marginLeft: ml, backgroundColor: colors.accent }}
      >
        <Image source={{ uri: item.fileUri }} style={styles.gridImage} contentFit="cover" transition={150} />
        {item.type === 'video' && (
          <View style={styles.videoOverlay}>
            <Ionicons name="play-circle" size={24} color="rgba(255,255,255,0.9)" />
            {item.duration != null && (
              <Text style={styles.duration}>{formatDur(item.duration)}</Text>
            )}
          </View>
        )}
        {item.isFavorite && (
          <Ionicons name="heart" size={12} color="#E05555" style={styles.favIcon} />
        )}
        {isSelected && (
          <View style={[styles.selectedOverlay, { borderColor: colors.primary }]}>
            <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={12} color={colors.primaryForeground} />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [sorted, selectedIds, colors]);

  const renderListItem = useCallback(({ item }: { item: VaultItem }) => {
    const isSelected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        onPress={() => handleItemPress(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.75}
        style={[styles.listRow, { borderBottomColor: colors.border }]}
      >
        <Image source={{ uri: item.fileUri }} style={styles.listThumb} contentFit="cover" />
        <View style={styles.listMeta}>
          <Text style={[styles.listName, { color: colors.foreground }]} numberOfLines={1}>
            {item.originalName ?? item.fileName}
          </Text>
          <Text style={[styles.listDetail, { color: colors.mutedForeground }]}>
            {item.type === 'video' && item.duration ? `${formatDur(item.duration)} · ` : ''}
            {formatStorageSize(item.size)}
          </Text>
        </View>
        {item.isFavorite && <Ionicons name="heart" size={14} color="#E05555" />}
        {isSelected && (
          <View style={[styles.listCheck, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={12} color={colors.primaryForeground} />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [sorted, selectedIds, colors]);

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {isSelecting ? t('vault.selected', { count: selectedIds.size }) : t('vault.title')}
          </Text>
          {!isSelecting && vaultItems.length > 0 && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {photoCount > 0 && `${photoCount} ${t('common.photos').toLowerCase()}`}
              {photoCount > 0 && videoCount > 0 && ' · '}
              {videoCount > 0 && `${videoCount} ${t('common.videos').toLowerCase()}`}
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {isSelecting ? (
            <>
              <Pressable onPress={handleSelectAll} style={styles.hBtn}>
                <Text style={[styles.hBtnText, { color: colors.primary }]}>{t('common.all')}</Text>
              </Pressable>
              <Pressable onPress={() => setSelectedIds(new Set())} style={styles.hBtn}>
                <Text style={[styles.hBtnText, { color: colors.primary }]}>{t('common.done')}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable onPress={() => { setShowSearch(s => !s); if (showSearch) setSearchQuery(''); }} style={styles.hBtn}>
                <Ionicons name={showSearch ? 'close' : 'search-outline'} size={22} color={colors.mutedForeground} />
              </Pressable>
              <Pressable onPress={() => setShowSortFilter(true)} style={styles.hBtn}>
                <Ionicons name="options-outline" size={22} color={colors.mutedForeground} />
              </Pressable>
              <Pressable onPress={() => router.push('/trash')} style={styles.hBtn}>
                <Ionicons name="trash-outline" size={20} color={colors.mutedForeground} />
                {trashedItems.length > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                    <Text style={styles.badgeText}>{trashedItems.length > 9 ? '9+' : trashedItems.length}</Text>
                  </View>
                )}
              </Pressable>
              <Pressable onPress={() => setShowImport(true)} style={[styles.importFab, { backgroundColor: colors.primary }]}>
                <Ionicons name="add" size={20} color={colors.primaryForeground} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* Search bar */}
      {showSearch && (
        <View style={[styles.searchBar, { backgroundColor: colors.accent, marginHorizontal: 16, marginBottom: 8 }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('vault.searchPlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      )}

      {/* Filter pills */}
      {!isSelecting && (
        <View style={styles.filterPills}>
          {(['all', 'photos', 'videos', 'favorites'] as FilterOption[]).map(f => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.pill, {
                backgroundColor: filter === f ? colors.primary : colors.accent,
              }]}
            >
              <Text style={[styles.pillText, { color: filter === f ? colors.primaryForeground : colors.mutedForeground }]}>
                {f === 'all' ? t('common.all') : f === 'photos' ? t('common.photos') : f === 'videos' ? t('common.videos') : t('vault.favorites')}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Grid or List */}
      {sorted.length === 0 ? (
        <EmptyState onImport={() => setShowImport(true)} colors={colors} filter={filter} search={searchQuery} />
      ) : viewMode === 'grid' ? (
        <FlatList
          data={sorted}
          renderItem={renderGridItem}
          keyExtractor={i => i.id}
          numColumns={COLS}
          columnWrapperStyle={styles.gridRow}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContent}
        />
      ) : (
        <FlatList
          data={sorted}
          renderItem={renderListItem}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Multi-select toolbar */}
      {isSelecting && (
        <View style={[styles.selToolbar, { backgroundColor: colors.card, paddingBottom: insets.bottom + 8 }]}>
          <ToolbarBtn icon="heart-outline" label={t('vault.actions.favorite')} onPress={handleFavoriteSelected} color={colors.primary} />
          <ToolbarBtn icon="folder-open-outline" label={t('vault.actions.album')} onPress={() => setShowAlbumPicker(true)} color={colors.foreground} />
          <ToolbarBtn icon="share-outline" label={t('vault.actions.export')} onPress={handleExportSelected} color={colors.foreground} />
          <ToolbarBtn icon="trash-outline" label={t('vault.actions.delete')} onPress={handleDeleteSelected} color={colors.destructive} />
        </View>
      )}

      <SortFilterSheet
        visible={showSortFilter}
        onClose={() => setShowSortFilter(false)}
        sort={sort}
        filter={filter}
        onSortChange={setSort}
        onFilterChange={setFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <ImportSheet visible={showImport} onClose={() => setShowImport(false)} />
      <AlbumPickerSheet
        visible={showAlbumPicker}
        onClose={() => setShowAlbumPicker(false)}
        onSelect={handleMoveToAlbum}
        title={t('vault.actions.addToAlbum', { count: selectedIds.size })}
      />
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

function EmptyState({ onImport, colors, filter, search }: { onImport: () => void; colors: any; filter: FilterOption; search: string }) {
  const { t } = useTranslation();
  const isEmpty = filter === 'all' && !search;
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
        <Ionicons name={isEmpty ? 'images-outline' : 'search-outline'} size={40} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {isEmpty ? t('vault.empty') : t('vault.noResults')}
      </Text>
      <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
        {isEmpty ? t('vault.emptyDesc') : t('vault.noResultsDesc')}
      </Text>
      {isEmpty && (
        <Pressable onPress={onImport} style={[styles.emptyBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={18} color={colors.primaryForeground} />
          <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>{t('vault.importBtn')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const formatDur = (s: number) => {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 8 },
  headerLeft: { flex: 1 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hBtn: { padding: 6, position: 'relative' },
  hBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  badge: { position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFF', fontSize: 9, fontFamily: 'Inter_700Bold' },
  importFab: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  filterPills: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  gridRow: { gap: GAP },
  gridContent: { paddingBottom: 100 },
  gridImage: { width: '100%', height: '100%' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 2 },
  duration: { color: '#FFF', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  favIcon: { position: 'absolute', bottom: 4, right: 4 },
  selectedOverlay: { ...StyleSheet.absoluteFillObject, borderWidth: 2.5, backgroundColor: 'rgba(196,151,90,0.2)' },
  checkmark: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 100 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  listThumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#1C1C2A' },
  listMeta: { flex: 1 },
  listName: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  listDetail: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  listCheck: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  selToolbar: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  toolbarBtn: { alignItems: 'center', gap: 4, paddingHorizontal: 12 },
  toolbarLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, marginTop: 4 },
  emptyBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
