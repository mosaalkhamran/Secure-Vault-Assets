import React, { useState, useCallback } from 'react';
import {
  Alert, Platform, Pressable, StyleSheet, Text, View, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useVault, VAULT_DIR } from '@/contexts/VaultContext';
import MediaGrid from '@/components/MediaGrid';
import { VaultItem } from '@/contexts/VaultContext';

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { vaultItems, addItems, lock } = useVault();
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isSelecting = selectedIds.size > 0;

  const handleImport = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not available', 'Media import requires a real iOS device.');
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (result.canceled) return;

    setImporting(true);
    try {
      const items = [];
      for (const asset of result.assets) {
        const ext = asset.uri.split('.').pop() ?? (asset.type === 'video' ? 'mp4' : 'jpg');
        const fileName = `${Date.now()}${Math.random().toString(36).substr(2, 6)}.${ext}`;
        const destUri = `${VAULT_DIR}${fileName}`;
        await FileSystem.copyAsync({ from: asset.uri, to: destUri });
        items.push({
          fileName: asset.fileName ?? fileName,
          fileUri: destUri,
          type: (asset.type === 'video' ? 'video' : 'photo') as 'photo' | 'video',
          size: asset.fileSize ?? 0,
          duration: asset.duration ?? undefined,
          width: asset.width,
          height: asset.height,
        });
      }
      await addItems(items);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Secured',
        `${items.length} item${items.length !== 1 ? 's' : ''} added to your vault.`,
        [
          { text: 'Keep Original', style: 'default' },
          { text: 'Done', style: 'cancel' },
        ]
      );
    } catch (e) {
      Alert.alert('Import Failed', 'Could not import some items. Please try again.');
    } finally {
      setImporting(false);
    }
  }, [addItems]);

  const handleItemPress = useCallback((item: VaultItem) => {
    if (isSelecting) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
    }
  }, [isSelecting]);

  const handleItemLongPress = useCallback((item: VaultItem) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedIds(new Set([item.id]));
  }, []);

  const handleLock = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    lock();
  }, [lock]);

  const photoCount = vaultItems.filter(i => i.type === 'photo').length;
  const videoCount = vaultItems.filter(i => i.type === 'video').length;

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Library</Text>
          {vaultItems.length > 0 && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {photoCount > 0 && `${photoCount} photo${photoCount !== 1 ? 's' : ''}`}
              {photoCount > 0 && videoCount > 0 && '  ·  '}
              {videoCount > 0 && `${videoCount} video${videoCount !== 1 ? 's' : ''}`}
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {isSelecting ? (
            <Pressable onPress={() => setSelectedIds(new Set())} style={styles.headerBtn}>
              <Text style={[styles.cancelText, { color: colors.primary }]}>Done</Text>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={handleLock} style={styles.headerBtn}>
                <Ionicons name="lock-closed-outline" size={22} color={colors.mutedForeground} />
              </Pressable>
              <Pressable onPress={handleImport} style={[styles.importBtn, { backgroundColor: colors.primary }]}>
                {importing ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Ionicons name="add" size={20} color={colors.primaryForeground} />
                )}
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* Grid */}
      <MediaGrid
        items={vaultItems}
        onItemPress={handleItemPress}
        onItemLongPress={handleItemLongPress}
        selectedIds={selectedIds}
        emptyComponent={<EmptyLibrary onImport={handleImport} colors={colors} />}
      />
    </View>
  );
}

function EmptyLibrary({ onImport, colors }: { onImport: () => void; colors: any }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconBg, { backgroundColor: colors.card }]}>
        <Ionicons name="images-outline" size={40} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your vault is empty</Text>
      <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
        Import photos and videos to{'\n'}keep them private and encrypted
      </Text>
      <Pressable onPress={onImport} style={[styles.emptyButton, { backgroundColor: colors.primary }]}>
        <Ionicons name="add" size={18} color={colors.primaryForeground} />
        <Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>Import Media</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: { padding: 4 },
  cancelText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  importBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  emptyButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, marginTop: 8,
  },
  emptyButtonText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
