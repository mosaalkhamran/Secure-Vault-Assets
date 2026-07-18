/**
 * Media Library Service — Vaultora
 * Handles export to Photos and PhotoKit interactions.
 */

import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export async function requestMediaLibraryPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await MediaLibrary.requestPermissionsAsync();
  return status === 'granted';
}

export async function saveFileToPhotos(fileUri: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const granted = await requestMediaLibraryPermission();
    if (!granted) return false;
    await MediaLibrary.saveToLibraryAsync(fileUri);
    return true;
  } catch (e) {
    console.error('saveFileToPhotos error:', e);
    return false;
  }
}

/**
 * Attempt to delete original from Photos library by asset ID.
 * Requires the assetId captured at import time.
 * NOTE: MediaLibrary.deleteAssetsAsync requires MEDIA_LIBRARY write permission.
 * On iOS, the user sees a system confirmation dialog.
 */
export async function deleteOriginalFromPhotos(assetId: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const granted = await requestMediaLibraryPermission();
    if (!granted) return false;
    const result = await MediaLibrary.deleteAssetsAsync([assetId]);
    return result;
  } catch (e) {
    console.error('deleteOriginalFromPhotos error:', e);
    return false;
  }
}

export async function getTempDir(): Promise<string> {
  const dir = `${FileSystem.cacheDirectory ?? ''}vaultora_tmp/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
  return dir;
}
