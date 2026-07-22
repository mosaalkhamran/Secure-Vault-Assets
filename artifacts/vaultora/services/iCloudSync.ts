/**
 * iCloudSync — server-free backup using react-native-cloud-store.
 * Gracefully degrades in Expo Go (no native module) — all functions
 * return safe defaults so the rest of the app never crashes.
 */

import type { VaultItem, Album } from '@/contexts/VaultContext';

// ─── Dynamic import with graceful degradation ─────────────────────────────────
let rncStore: any = null;
try {
  rncStore = require('react-native-cloud-store');
} catch {
  // Running in Expo Go — native module not available
}

const CLOUD_META  = 'vault/metadata.json';
const CLOUD_MEDIA = (id: string) => `vault/media/${id}`;
const KV_ENABLED  = 'vault_icloud_sync_enabled';

// Strip file:// prefix for RNCS file operations
const posix = (uri: string) => uri.replace(/^file:\/\//, '');

// ─── Availability ─────────────────────────────────────────────────────────────

export async function isCloudAvailable(): Promise<boolean> {
  if (!rncStore) return false;
  try {
    return await rncStore.isICloudAvailable();
  } catch {
    return false;
  }
}

// ─── Detect existing backup (for fresh-install restore prompt) ─────────────────

export async function checkForExistingBackup(): Promise<boolean> {
  if (!rncStore) return false;
  try {
    // Fast check: KV flag first (cheap), then verify file exists
    const flag = await rncStore.ICloudStorage.getItem(KV_ENABLED).catch(() => null);
    if (flag !== 'true') return false;
    return await rncStore.exist(CLOUD_META).catch(() => false);
  } catch {
    return false;
  }
}

// ─── Mark sync preference in iCloud KV (survives reinstall) ──────────────────

export async function markSyncEnabled(enabled: boolean): Promise<void> {
  if (!rncStore) return;
  try {
    if (enabled) {
      await rncStore.ICloudStorage.setItem(KV_ENABLED, 'true');
    } else {
      await rncStore.ICloudStorage.removeItem(KV_ENABLED);
    }
  } catch { /* silent */ }
}

// ─── Upload metadata (items + albums list) ─────────────────────────────────────

export async function uploadMetadata(
  items: VaultItem[],
  albums: Album[],
): Promise<boolean> {
  if (!rncStore) return false;
  try {
    const json = JSON.stringify({ items, albums, savedAt: new Date().toISOString() });
    await rncStore.writeFile(CLOUD_META, json);
    return true;
  } catch (e) {
    console.warn('[iCloudSync] uploadMetadata error:', e);
    return false;
  }
}

// ─── Download metadata ────────────────────────────────────────────────────────

export async function downloadMetadata(): Promise<{
  items: VaultItem[];
  albums: Album[];
  savedAt?: string;
} | null> {
  if (!rncStore) return null;
  try {
    const exists = await rncStore.exist(CLOUD_META).catch(() => false);
    if (!exists) return null;
    const json = await rncStore.readFile(CLOUD_META);
    return JSON.parse(json);
  } catch (e) {
    console.warn('[iCloudSync] downloadMetadata error:', e);
    return null;
  }
}

// ─── Upload a single media file ────────────────────────────────────────────────

export async function uploadFile(localUri: string, itemId: string): Promise<boolean> {
  if (!rncStore) return false;
  try {
    await rncStore.upload(posix(localUri), CLOUD_MEDIA(itemId));
    return true;
  } catch (e) {
    console.warn('[iCloudSync] uploadFile error:', itemId, e);
    return false;
  }
}

// ─── Download a media file to a local path ────────────────────────────────────

export async function downloadFile(itemId: string, targetUri: string): Promise<boolean> {
  if (!rncStore) return false;
  try {
    const cloudPath = CLOUD_MEDIA(itemId);
    const exists = await rncStore.exist(cloudPath).catch(() => false);
    if (!exists) return false;
    await rncStore.download(cloudPath);
    // After download, copy from iCloud container to our local vault dir
    await rncStore.copyFile(cloudPath, posix(targetUri));
    return true;
  } catch (e) {
    console.warn('[iCloudSync] downloadFile error:', itemId, e);
    return false;
  }
}

// ─── Delete a media file from cloud ───────────────────────────────────────────

export async function deleteFile(itemId: string): Promise<void> {
  if (!rncStore) return;
  try {
    const cloudPath = CLOUD_MEDIA(itemId);
    const exists = await rncStore.exist(cloudPath).catch(() => false);
    if (exists) await rncStore.unlink(cloudPath);
  } catch { /* silent */ }
}

// ─── Full sync: upload all local items ────────────────────────────────────────

export async function fullSync(
  items: VaultItem[],
  albums: Album[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ success: boolean; uploaded: number; failed: number }> {
  if (!rncStore) return { success: false, uploaded: 0, failed: 0 };

  let uploaded = 0;
  let failed = 0;
  const activeItems = items.filter(i => !i.deletedAt);

  for (let i = 0; i < activeItems.length; i++) {
    const item = activeItems[i];
    const ok = await uploadFile(item.fileUri, item.id);
    if (ok) uploaded++; else failed++;
    onProgress?.(i + 1, activeItems.length);
  }

  const metaOk = await uploadMetadata(items, albums);
  return { success: metaOk, uploaded, failed };
}

// ─── Restore: download all files from cloud ────────────────────────────────────

export async function restoreAll(
  vaultDir: string,
  onProgress?: (done: number, total: number) => void,
): Promise<{
  items: VaultItem[];
  albums: Album[];
  restoredFiles: number;
  failedFiles: number;
} | null> {
  if (!rncStore) return null;

  const meta = await downloadMetadata();
  if (!meta) return null;

  const activeItems = meta.items.filter(i => !i.deletedAt);
  let restoredFiles = 0;
  let failedFiles = 0;

  for (let i = 0; i < activeItems.length; i++) {
    const item = activeItems[i];
    const targetUri = `${vaultDir}${item.fileName}`;
    const ok = await downloadFile(item.id, targetUri);
    if (ok) {
      restoredFiles++;
      // Update fileUri to new local path
      item.fileUri = targetUri;
    } else {
      failedFiles++;
    }
    onProgress?.(i + 1, activeItems.length);
  }

  return { items: meta.items, albums: meta.albums, restoredFiles, failedFiles };
}
