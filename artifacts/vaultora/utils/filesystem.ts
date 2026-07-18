/**
 * Filesystem utilities — wraps deprecated expo-file-system APIs
 * so they don't spam the console with deprecation warnings.
 */
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/** Recursively create a directory, suppressing the deprecation warning. */
export async function ensureDirectory(uri: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    // New SDK 54 API — Directory class
    const Dir = (FileSystem as any).Directory;
    if (Dir) {
      const d = new Dir(uri);
      if (typeof d.create === 'function') {
        d.create();
        return;
      }
    }
  } catch {}
  // Fallback to legacy (suppressed by try/catch, not by console intercept)
  try {
    await (FileSystem as any).makeDirectoryAsync(uri, { intermediates: true });
  } catch {}
}
