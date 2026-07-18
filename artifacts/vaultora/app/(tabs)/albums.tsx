import React, { useState } from 'react';
import {
  Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useVault, Album } from '@/contexts/VaultContext';

export default function AlbumsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { albums, vaultItems, createAlbum, renameAlbum, deleteAlbum } = useVault();
  const [showModal, setShowModal] = useState<'create' | 'rename' | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [nameInput, setNameInput] = useState('');

  const getCoverUri = (album: Album) =>
    vaultItems.find(i => album.itemIds.includes(i.id))?.fileUri ?? null;

  const getItemCount = (album: Album) =>
    album.itemIds.filter(id => vaultItems.some(v => v.id === id)).length;

  const handleCreate = async () => {
    if (!nameInput.trim()) return;
    await createAlbum(nameInput.trim());
    setNameInput('');
    setShowModal(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRename = async () => {
    if (!nameInput.trim() || !selectedAlbum) return;
    await renameAlbum(selectedAlbum.id, nameInput.trim());
    setNameInput('');
    setSelectedAlbum(null);
    setShowModal(null);
  };

  const handleLongPress = (album: Album) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(album.name, 'What would you like to do?', [
      {
        text: 'Rename',
        onPress: () => { setSelectedAlbum(album); setNameInput(album.name); setShowModal('rename'); },
      },
      {
        text: 'Delete (keep files)',
        style: 'destructive',
        onPress: () => Alert.alert('Delete Album?', `Files will remain in your vault.`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteAlbum(album.id, false) },
        ]),
      },
      {
        text: 'Delete with files',
        style: 'destructive',
        onPress: () => Alert.alert('Delete Album and Files?', `${getItemCount(album)} files will be moved to trash.`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteAlbum(album.id, true) },
        ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Albums</Text>
        <Pressable
          onPress={() => { setNameInput(''); setShowModal('create'); }}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={20} color={colors.primaryForeground} />
        </Pressable>
      </View>

      <FlatList
        data={albums}
        keyExtractor={a => a.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const cover = getCoverUri(item);
          const count = getItemCount(item);
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/album/[id]', params: { id: item.id } })}
              onLongPress={() => handleLongPress(item)}
              style={[styles.card, { backgroundColor: colors.card }]}
            >
              <View style={[styles.cover, { backgroundColor: colors.accent }]}>
                {cover ? (
                  <Image source={{ uri: cover }} style={styles.coverImage} contentFit="cover" />
                ) : (
                  <Ionicons name="folder-outline" size={36} color={colors.mutedForeground} />
                )}
                {count > 1 && (
                  <View style={[styles.countBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <Text style={styles.countText}>{count}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.cardCount, { color: colors.mutedForeground }]}>
                  {count} {count === 1 ? 'item' : 'items'}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="folder-open-outline" size={40} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Albums</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Create albums to organize your vault
            </Text>
            <Pressable
              onPress={() => { setNameInput(''); setShowModal('create'); }}
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={18} color={colors.primaryForeground} />
              <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>New Album</Text>
            </Pressable>
          </View>
        }
      />

      {/* Create / Rename Modal */}
      <Modal visible={showModal !== null} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => { setShowModal(null); setNameInput(''); }}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {showModal === 'create' ? 'New Album' : 'Rename Album'}
            </Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Album name"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={showModal === 'create' ? handleCreate : handleRename}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => { setShowModal(null); setNameInput(''); }} style={styles.modalBtn}>
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={showModal === 'create' ? handleCreate : handleRename}
                style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.primaryForeground }]}>
                  {showModal === 'create' ? 'Create' : 'Rename'}
                </Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 100, gap: 12 },
  row: { gap: 12 },
  card: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  cover: { width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  coverImage: { width: '100%', height: '100%' },
  countBadge: { position: 'absolute', bottom: 8, right: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  countText: { color: '#FFF', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  cardInfo: { padding: 10, gap: 2 },
  cardName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  cardCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold' },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  emptyBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: 300, borderRadius: 20, padding: 24, gap: 16 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 15 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalBtnPrimary: {},
  modalBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
});
