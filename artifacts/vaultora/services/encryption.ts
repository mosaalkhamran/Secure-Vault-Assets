/**
 * Encryption Service — Vaultora
 *
 * Architecture:
 * - In Expo Go (development): files are copied as-is. The "encrypted" flag is
 *   set in metadata but actual AES-256-GCM encryption requires a Development
 *   Build with react-native-quick-crypto or expo-crypto native module.
 * - In Development Build / Production: replace the stubs below with real
 *   AES-256-GCM calls using react-native-quick-crypto.
 *
 * The interface is stable — only the implementation inside each function changes
 * between environments.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { ensureDirectory } from '@/utils/filesystem';
import { sha256 } from 'js-sha256';

export interface EncryptedFileResult {
  encryptedUri: string;
  checksum: string;
  nonce: string;
  authTag: string;
  sizeBytes: number;
}

export interface VaultKey {
  keyHex: string; // 256-bit key (64 hex chars)
  salt: string;   // random salt used when deriving from PIN
}

// ─── Key derivation (PBKDF2-like using repeated SHA-256) ─────────────────────

const ITERATIONS = 100_000;

export function deriveKey(pin: string, salt: string): string {
  let hash = sha256(`${salt}:${pin}`);
  for (let i = 1; i < ITERATIONS; i++) {
    hash = sha256(`${hash}:${salt}:${i}`);
  }
  return hash; // 64-char hex = 256-bit key
}

export function generateSalt(): string {
  const bytes = new Uint8Array(32);
  // Fallback to Math.random for Expo Go; real native crypto for prod
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateVaultKey(): VaultKey {
  const salt = generateSalt();
  const randomBytes = new Uint8Array(32);
  for (let i = 0; i < randomBytes.length; i++) {
    randomBytes[i] = Math.floor(Math.random() * 256);
  }
  const keyHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return { keyHex, salt };
}

// ─── File checksums ───────────────────────────────────────────────────────────

export async function computeFileChecksum(fileUri: string): Promise<string> {
  try {
    // Read first 64KB + file info for a lightweight checksum
    const info = await FileSystem.getInfoAsync(fileUri, { size: true } as any);
    const sizeStr = (info.exists && 'size' in info) ? String(info.size) : '0';
    // For a real implementation, hash the entire file content
    // For now, combine URI + size as a fast integrity marker
    const content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
      length: 65536,
      position: 0,
    }).catch(() => '');
    return sha256(`${fileUri}:${sizeStr}:${content}`);
  } catch {
    return sha256(fileUri);
  }
}

// ─── File encryption (stub for Expo Go; real AES-256-GCM in prod) ────────────

export async function encryptFile(
  sourceUri: string,
  destDir: string,
  vaultKeyHex: string,
): Promise<EncryptedFileResult> {
  const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 8)}.vault`;
  const destUri = `${destDir}${fileName}`;

  // Ensure directory exists
  await ensureDirectory(destDir);

  // In Expo Go: copy directly (no real encryption available without native module)
  // In Production/DevBuild: use react-native-quick-crypto AES-256-GCM here
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });

  const info = await FileSystem.getInfoAsync(destUri, { size: true } as any);
  const sizeBytes = (info.exists && 'size' in info && info.size) ? info.size : 0;
  const checksum = await computeFileChecksum(destUri);
  const nonce = generateSalt().substring(0, 24); // 96-bit nonce
  const authTag = sha256(`${nonce}:${vaultKeyHex}:${checksum}`).substring(0, 32);

  return { encryptedUri: destUri, checksum, nonce, authTag, sizeBytes };
}

export async function decryptFileToTemp(
  encryptedUri: string,
  tempDir: string,
  vaultKeyHex: string,
  nonce: string,
): Promise<string> {
  const tempName = `tmp_${Date.now()}.dat`;
  const tempUri = `${tempDir}${tempName}`;
  await ensureDirectory(tempDir);
  // In Expo Go: copy directly
  // In Production: decrypt AES-256-GCM here
  await FileSystem.copyAsync({ from: encryptedUri, to: tempUri });
  return tempUri;
}

export async function verifyFileIntegrity(
  encryptedUri: string,
  expectedChecksum: string,
  expectedAuthTag: string,
  vaultKeyHex: string,
  nonce: string,
): Promise<boolean> {
  try {
    const actualChecksum = await computeFileChecksum(encryptedUri);
    // For real AES-GCM this would verify the auth tag cryptographically
    return actualChecksum === expectedChecksum;
  } catch {
    return false;
  }
}

export async function cleanTempFiles(tempDir: string): Promise<void> {
  try {
    const files = await FileSystem.readDirectoryAsync(tempDir).catch(() => []);
    await Promise.all(
      files
        .filter(f => f.startsWith('tmp_'))
        .map(f => FileSystem.deleteAsync(`${tempDir}${f}`, { idempotent: true }))
    );
  } catch {}
}
