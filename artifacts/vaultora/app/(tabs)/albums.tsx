import React, { useState } from 'react';
import {
  Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useVault, Album } from '@/contexts/VaultContext';

export default function AlbumsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { albums, vaultItems, createAlbum, deleteAlbum } = useVault();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createAlbum(newName.trim());
    setNewName('');
    setShowCreate(false);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (album: Album) => {
    Alert.alert('Delete Album', `Delete "${album.name}"? Items will not be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => deleteAlbum(album.id),
      },
    ]);
  };

  const getCoverUri = (album: Album): string | null => {
    const first = vaultItems.find(i => album.itemIds.includes(i.id));
    return first?.fileUri ?? null;
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Albums</Text>
        <Pressable
          onPress={() => setShowCreate(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={20} color={colors.primaryForeground} />
        </Pressable>
      </View>

      <FlatList
        data={albums}
        keyExtractor={a => a.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => {
          const cover = getCoverUri(item);
          const count = item.itemIds.filter(id => vaultItems.some(v => v.id === id)).length;
          return (
            <Pressable
              onLongPress={() => handleDelete(item)}
              style={[styles.albumCard, { backgroundColor: colors.card }]}
            >
              <View style={[styles.albumCover, { backgroundColor: colors.accent }]}>
                {cover ? (
                  <Image source={{ uri: cover }} style={styles.coverImage} contentFit="cover" />
                ) : (
                  <Ionicons name="folder-outline" size={36} color={colors.mutedForeground} />
                )}
              </View>
              <View style={styles.albumInfo}>
                <Text style={[styles.albumName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.albumCount, { color: colors.mutedForeground }]}>
                  {count} item{count !== 1 ? 's' : ''}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIconBg, { backgroundColor: colors.card }]}>
              <Ionicons name="folder-open-outline" size={40} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Albums</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Create albums to organize your vault
            </Text>
          </View>
        }
      />

      {/* Create Album Modal */}
      <Modal visible={showCreate} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCreate(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Album</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Album name"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => { setShowCreate(false); setNewName(''); }} style={styles.modalBtn}>
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreate}
                style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.primaryForeground }]}>Create</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 100, gap: 16 },
  row: { gap: 16 },
  albumCard: {
    flex: 1, borderRadius: 16, overflow: 'hidden',
  },
  albumCover: {
    width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
  },
  coverImage: { width: '100%', height: '100%' },
  albumInfo: { padding: 12, gap: 2 },
  albumName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  albumCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: 300, borderRadius: 20, padding: 24, gap: 16 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  input: {
    height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14,
    fontFamily: 'Inter_400Regular', fontSize: 15,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalBtnPrimary: {},
  modalBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
});
