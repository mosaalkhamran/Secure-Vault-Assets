import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import { useVault, VAULT_DIR } from '@/contexts/VaultContext';
import { ensureDirectory } from '@/utils/filesystem';

interface ImportSheetProps {
  visible: boolean;
  onClose: () => void;
}

type ImportState = 'selecting' | 'confirming' | 'importing' | 'done';

interface SelectedAsset {
  uri: string;
  type: 'photo' | 'video';
  fileName: string;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  assetId?: string;
}

export default function ImportSheet({ visible, onClose }: ImportSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { addItems, settings } = useVault();

  const [state, setState] = useState<ImportState>('selecting');
  const [selected, setSelected] = useState<SelectedAsset[]>([]);
  const [keepOriginal, setKeepOriginal] = useState(settings.keepOriginalDefault);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [doneCount, setDoneCount] = useState(0);

  const totalSize = selected.reduce((s, a) => s + a.size, 0);

  const formatSize = (b: number) => {
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePickMedia = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(t('importSheet.notAvailable'), t('importSheet.notAvailableMsg'));
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('importSheet.permRequired'), t('importSheet.permRequiredMsg'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'] as any,
      allowsMultipleSelection: true,
      quality: 1,
      exif: false,
    });
    if (result.canceled || !result.assets.length) {
      onClose();
      return;
    }

    const assets: SelectedAsset[] = result.assets.map(a => ({
      uri: a.uri,
      type: a.type === 'video' ? 'video' : 'photo',
      fileName: a.fileName ?? a.uri.split('/').pop() ?? `file_${Date.now()}`,
      size: a.fileSize ?? 0,
      duration: a.duration ?? undefined,
      width: a.width,
      height: a.height,
      assetId: a.assetId ?? undefined,
    }));
    setSelected(assets);
    setState('confirming');
  };

  const handleImport = async () => {
    setState('importing');
    setDoneCount(0);
    const itemsToAdd = [];

    for (const asset of selected) {
      try {
        const ext = asset.uri.split('.').pop() ?? (asset.type === 'video' ? 'mp4' : 'jpg');
        const fileName = `${Date.now()}${Math.random().toString(36).substr(2, 6)}.${ext}`;
        const destUri = `${VAULT_DIR}${fileName}`;

        await ensureDirectory(VAULT_DIR);
        await FileSystem.copyAsync({ from: asset.uri, to: destUri });

        const info = await FileSystem.getInfoAsync(destUri, { size: true } as any);
        const size = (info.exists && 'size' in info) ? (info.size ?? asset.size) : asset.size;

        itemsToAdd.push({
          fileName: asset.fileName,
          fileUri: destUri,
          originalName: asset.fileName,
          type: asset.type,
          size,
          duration: asset.duration,
          width: asset.width,
          height: asset.height,
          assetId: asset.assetId,
        });

        setDoneCount(c => c + 1);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        console.error('Import error for', asset.fileName, e);
      }
    }

    if (itemsToAdd.length > 0) {
      await addItems(itemsToAdd);
    }

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setState('done');
  };

  const handleClose = () => {
    setState('selecting');
    setSelected([]);
    setProgress({});
    setDoneCount(0);
    onClose();
  };

  useEffect(() => {
    if (visible) {
      setState('selecting');
      handlePickMedia();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={state === 'confirming' ? handleClose : undefined} />
        <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Confirming */}
          {state === 'confirming' && (
            <>
              <Text style={[styles.title, { color: colors.foreground }]}>{t('importSheet.title')}</Text>
              <View style={[styles.statsRow, { backgroundColor: colors.accent }]}>
                <View style={styles.stat}>
                  <Text style={[styles.statNum, { color: colors.foreground }]}>{selected.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    {selected.length === 1 ? t('common.item') : t('common.items')}
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.stat}>
                  <Text style={[styles.statNum, { color: colors.foreground }]}>{formatSize(totalSize)}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t('importSheet.totalSize')}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.stat}>
                  <Text style={[styles.statNum, { color: colors.foreground }]}>
                    {selected.filter(a => a.type === 'photo').length}P
                    {' '}
                    {selected.filter(a => a.type === 'video').length}V
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t('importSheet.types')}</Text>
                </View>
              </View>

              <View style={[styles.keepRow, { borderColor: colors.border }]}>
                <View style={styles.keepText}>
                  <Text style={[styles.keepTitle, { color: colors.foreground }]}>{t('importSheet.keepOriginal')}</Text>
                  <Text style={[styles.keepDesc, { color: colors.mutedForeground }]}>
                    {keepOriginal ? t('importSheet.keepOriginalOn') : t('importSheet.keepOriginalOff')}
                  </Text>
                </View>
                <Switch
                  value={keepOriginal}
                  onValueChange={setKeepOriginal}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>

              {!keepOriginal && (
                <View style={[styles.warningBox, { backgroundColor: 'rgba(224,85,85,0.1)', borderColor: 'rgba(224,85,85,0.3)' }]}>
                  <Ionicons name="warning-outline" size={16} color={colors.destructive} />
                  <Text style={[styles.warningText, { color: colors.destructive }]}>
                    {t('importSheet.warning')}
                  </Text>
                </View>
              )}

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={handleClose}
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.cancelText, { color: colors.foreground }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleImport}
                  style={[styles.importBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.importText, { color: colors.primaryForeground }]}>
                    {t('importSheet.importBtn', { count: selected.length })}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Importing */}
          {state === 'importing' && (
            <View style={styles.importingSection}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.importingTitle, { color: colors.foreground }]}>{t('importSheet.importing')}</Text>
              <Text style={[styles.importingCount, { color: colors.mutedForeground }]}>
                {t('importSheet.progress', { done: doneCount, total: selected.length })}
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, {
                  backgroundColor: colors.primary,
                  width: `${selected.length > 0 ? (doneCount / selected.length) * 100 : 0}%`,
                }]} />
              </View>
              <Text style={[styles.importingHint, { color: colors.mutedForeground }]}>
                {t('importSheet.doNotClose')}
              </Text>
            </View>
          )}

          {/* Done */}
          {state === 'done' && (
            <View style={styles.doneSection}>
              <View style={[styles.doneIcon, { backgroundColor: 'rgba(76,175,135,0.15)' }]}>
                <Ionicons name="checkmark-circle" size={40} color="#4CAF87" />
              </View>
              <Text style={[styles.doneTitle, { color: colors.foreground }]}>
                {t('importSheet.success', { count: doneCount })}
              </Text>
              <Text style={[styles.doneDesc, { color: colors.mutedForeground }]}>
                {keepOriginal ? t('importSheet.successOriginalKept') : t('importSheet.successOriginalRemoved')}
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>{t('common.done')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Selecting (while picker is open) */}
          {state === 'selecting' && (
            <View style={styles.selectingSection}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.selectingText, { color: colors.mutedForeground }]}>
                {t('importSheet.loading')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 20, gap: 16 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  statsRow: { flexDirection: 'row', borderRadius: 16, padding: 16 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  statDivider: { width: StyleSheet.hairlineWidth },
  keepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  keepText: { flex: 1 },
  keepTitle: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  keepDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  warningBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  warningText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  cancelText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  importBtn: { flex: 2, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  importText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  importingSection: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  importingTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  importingCount: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  progressTrack: { width: '80%', height: 6, borderRadius: 3 },
  progressFill: { height: '100%', borderRadius: 3, minWidth: 4 },
  importingHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  doneSection: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  doneIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold' },
  doneDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  doneBtn: { marginTop: 8, height: 50, paddingHorizontal: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  doneBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  selectingSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 20 },
  selectingText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
