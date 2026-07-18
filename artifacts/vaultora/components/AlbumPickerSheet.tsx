import React, { useState } from 'react';
import {
  FlatList, Modal, Platform, Pressable,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useVault, Album } from '@/contexts/VaultContext';

interface AlbumPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (albumId: string) => void;
  title?: string;
}

export default function AlbumPickerSheet({
  visible, onClose, onSelect, title = 'Add to Album',
}: AlbumPickerSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { albums, createAlbum } = useVault();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const handleSelect = (album: Album) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(album.id);
    onClose();
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const album = await createAlbum(newName.trim());
    setNewName('');
    setShowCreate(false);
    onSelect(album.id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
            <Pressable onPress={() => setShowCreate(s => !s)} style={[styles.newBtn, { backgroundColor: 'rgba(196,151,90,0.15)' }]}>
              <Ionicons name={showCreate ? 'close' : 'add'} size={18} color="#C4975A" />
              <Text style={[styles.newBtnText, { color: '#C4975A' }]}>{showCreate ? 'Cancel' : 'New'}</Text>
            </Pressable>
          </View>

          {showCreate && (
            <View style={styles.createRow}>
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
              <Pressable
                onPress={handleCreate}
                disabled={!newName.trim()}
                style={[styles.createBtn, { backgroundColor: newName.trim() ? colors.primary : colors.accent }]}
              >
                <Ionicons name="checkmark" size={20} color={newName.trim() ? colors.primaryForeground : colors.mutedForeground} />
              </Pressable>
            </View>
          )}

          {albums.length === 0 && !showCreate ? (
            <View style={styles.empty}>
              <Ionicons name="folder-open-outline" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No albums yet. Tap "New" to create one.
              </Text>
            </View>
          ) : (
            <FlatList
              data={albums}
              keyExtractor={a => a.id}
              style={{ maxHeight: 340 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  style={[styles.albumRow, { borderBottomColor: colors.border }]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.folderIcon, { backgroundColor: 'rgba(196,151,90,0.12)' }]}>
                    <Ionicons name="folder-outline" size={20} color="#C4975A" />
                  </View>
                  <View style={styles.albumInfo}>
                    <Text style={[styles.albumName, { color: colors.foreground }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.albumCount, { color: colors.mutedForeground }]}>
                      {item.itemIds.length} {item.itemIds.length === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 20, gap: 12 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  newBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  createRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontFamily: 'Inter_400Regular', fontSize: 15 },
  createBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  albumRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  folderIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  albumInfo: { flex: 1 },
  albumName: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  albumCount: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
