import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, FlatList, Platform, Pressable,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import { useVault, VaultItem } from '@/contexts/VaultContext';
import VideoPlayer from '@/components/VideoPlayer';

const { width: SW, height: SH } = Dimensions.get('window');

export default function ViewerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { id, source } = useLocalSearchParams<{ id: string; source?: string }>();
  const { vaultItems, trashedItems, toggleFavorite, softDelete, exportToPhotos } = useVault();

  const allItems = source === 'trash' ? trashedItems : vaultItems;
  const startIndex = allItems.findIndex(i => i.id === id);
  const [currentIndex, setCurrentIndex] = useState(Math.max(0, startIndex));
  const [showControls, setShowControls] = useState(true);
  const controlsAnim = useRef(new Animated.Value(1)).current;
  const listRef = useRef<FlatList>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentItem = allItems[currentIndex];

  useEffect(() => {
    if (startIndex >= 0) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: startIndex, animated: false });
      }, 50);
    }
    scheduleHide();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  const scheduleHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => toggleControls(false), 3500);
  };

  const toggleControls = (show?: boolean) => {
    const next = show !== undefined ? show : !showControls;
    setShowControls(next);
    Animated.timing(controlsAnim, {
      toValue: next ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    if (next) scheduleHide();
  };

  const handleTap = () => toggleControls();

  const handleDelete = () => {
    softDelete(currentItem.id);
    if (allItems.length <= 1) {
      router.back();
    } else if (currentIndex >= allItems.length - 1) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleExport = async () => {
    const ok = await exportToPhotos(currentItem.id);
    // Could show a toast here
  };

  const renderItem = useCallback(({ item }: { item: VaultItem }) => (
    <Pressable style={styles.slide} onPress={handleTap}>
      {item.type === 'video' ? (
        <VideoPlayer uri={item.fileUri} paused={item.id !== currentItem?.id} />
      ) : (
        <ScrollView
          style={styles.slide}
          contentContainerStyle={styles.imageContainer}
          maximumZoomScale={5}
          minimumZoomScale={1}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          centerContent
          bouncesZoom
        >
          <Image
            source={{ uri: item.fileUri }}
            style={{ width: SW, height: SH }}
            contentFit="contain"
            transition={100}
          />
        </ScrollView>
      )}
    </Pressable>
  ), [currentItem?.id, handleTap]);

  if (!currentItem) {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 8 }]}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={allItems}
        renderItem={renderItem}
        keyExtractor={i => i.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: SW, offset: SW * index, index })}
        initialScrollIndex={Math.max(0, startIndex)}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
          setCurrentIndex(idx);
          toggleControls(true);
        }}
        windowSize={3}
        maxToRenderPerBatch={3}
      />

      {/* Top controls */}
      <Animated.View style={[styles.topBar, { paddingTop: insets.top + 8, opacity: controlsAnim }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.controlBtn}>
          <Ionicons name="chevron-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.topMeta}>
          <Text style={styles.topCounter}>
            {t('viewer.counter', { current: currentIndex + 1, total: allItems.length })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => toggleFavorite(currentItem.id)}
          style={styles.controlBtn}
        >
          <Ionicons
            name={currentItem.isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={currentItem.isFavorite ? '#E05555' : '#FFF'}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom controls */}
      <Animated.View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, opacity: controlsAnim }]}>
        <ActionBtn icon="share-outline" label={t('viewer.export')} onPress={handleExport} />
        <ActionBtn icon="information-circle-outline" label={t('viewer.info')} onPress={() => {}} />
        <ActionBtn
          icon={currentItem.isFavorite ? 'heart' : 'heart-outline'}
          label={t('viewer.favorite')}
          onPress={() => toggleFavorite(currentItem.id)}
          color={currentItem.isFavorite ? '#E05555' : '#FFF'}
        />
        {source !== 'trash' && (
          <ActionBtn icon="trash-outline" label={t('viewer.delete')} onPress={handleDelete} color="#E05555" />
        )}
      </Animated.View>

      {/* File info */}
      <Animated.View style={[styles.fileInfo, { bottom: insets.bottom + 80, opacity: controlsAnim }]}>
        <Text style={styles.fileName} numberOfLines={1}>{currentItem.originalName ?? currentItem.fileName}</Text>
        <Text style={styles.fileMeta}>
          {currentItem.type === 'video' && currentItem.duration
            ? `${formatDuration(currentItem.duration)} · `
            : ''}
          {formatSize(currentItem.size)}
        </Text>
      </Animated.View>
    </View>
  );
}

function ActionBtn({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionBtn}>
      <Ionicons name={icon as any} size={24} color={color ?? '#FFF'} />
      <Text style={[styles.actionLabel, { color: color ?? '#FFF' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  slide: { width: SW, height: SH },
  imageContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlBtn: { padding: 8, width: 44, alignItems: 'center' },
  topMeta: { flex: 1, alignItems: 'center' },
  topCounter: { color: '#FFF', fontFamily: 'Inter_500Medium', fontSize: 15 },
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actionBtn: { alignItems: 'center', gap: 4, paddingHorizontal: 16 },
  actionLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  fileInfo: {
    position: 'absolute',
    left: 16, right: 16,
    alignItems: 'center',
  },
  fileName: { color: '#FFF', fontFamily: 'Inter_500Medium', fontSize: 13, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  fileMeta: { color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter_400Regular', fontSize: 12 },
  backBtn: { position: 'absolute', left: 8, zIndex: 10, padding: 8 },
});
