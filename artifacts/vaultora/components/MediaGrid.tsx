import React, { useCallback } from 'react';
import {
  Dimensions, FlatList, Platform, StyleSheet, TouchableOpacity, View, Text,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { VaultItem } from '@/contexts/VaultContext';

const { width } = Dimensions.get('window');
const COLS = 3;
const GAP = 2;
const ITEM_SIZE = (width - GAP * (COLS - 1)) / COLS;

interface MediaGridProps {
  items: VaultItem[];
  onItemPress: (item: VaultItem) => void;
  onItemLongPress?: (item: VaultItem) => void;
  selectedIds?: Set<string>;
  emptyComponent?: React.ReactNode;
}

export default function MediaGrid({
  items, onItemPress, onItemLongPress, selectedIds, emptyComponent,
}: MediaGridProps) {
  const colors = useColors();

  const renderItem = useCallback(({ item, index }: { item: VaultItem; index: number }) => {
    const isSelected = selectedIds?.has(item.id);
    const marginLeft = index % COLS === 0 ? 0 : GAP;

    return (
      <TouchableOpacity
        onPress={() => onItemPress(item)}
        onLongPress={() => onItemLongPress?.(item)}
        activeOpacity={0.85}
        style={[styles.itemContainer, { marginLeft, width: ITEM_SIZE, height: ITEM_SIZE }]}
      >
        <Image
          source={{ uri: item.fileUri }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {item.type === 'video' && (
          <View style={styles.videoOverlay}>
            <Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.9)" />
            {item.duration != null && (
              <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
            )}
          </View>
        )}
        {item.isFavorite && (
          <View style={styles.favoriteIcon}>
            <Ionicons name="heart" size={12} color="#E05555" />
          </View>
        )}
        {isSelected && (
          <View style={[styles.selectedOverlay, { borderColor: colors.primary }]}>
            <View style={[styles.selectedCheck, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={12} color={colors.primaryForeground} />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [items, selectedIds, colors]);

  if (items.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      numColumns={COLS}
      columnWrapperStyle={styles.row}
      ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
    />
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  list: { paddingBottom: 100 },
  row: { gap: GAP },
  itemContainer: {
    overflow: 'hidden',
    backgroundColor: '#1C1C2A',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  duration: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  favoriteIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2.5,
    backgroundColor: 'rgba(196,151,90,0.2)',
  },
  selectedCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
