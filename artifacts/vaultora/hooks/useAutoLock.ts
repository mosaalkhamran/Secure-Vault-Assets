import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useVault } from '@/contexts/VaultContext';

export function useAutoLock() {
  const { isUnlocked, lock, settings } = useVault();
  const bgTimestamp = useRef<number | null>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isUnlocked) return;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        bgTimestamp.current = Date.now();
        // Lock immediately if setting is 0
        if (settings.autoLockSeconds === 0) {
          lock();
          return;
        }
        // Lock after N seconds
        if (settings.autoLockSeconds > 0) {
          if (lockTimer.current) clearTimeout(lockTimer.current);
          lockTimer.current = setTimeout(() => {
            lock();
          }, settings.autoLockSeconds * 1000);
        }
        // -1 = never auto-lock
      } else if (nextState === 'active') {
        if (lockTimer.current) {
          clearTimeout(lockTimer.current);
          lockTimer.current = null;
        }
        // Check elapsed time if returning from background
        if (bgTimestamp.current && settings.autoLockSeconds > 0) {
          const elapsed = (Date.now() - bgTimestamp.current) / 1000;
          if (elapsed >= settings.autoLockSeconds) {
            lock();
          }
        }
        bgTimestamp.current = null;
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
      if (lockTimer.current) clearTimeout(lockTimer.current);
    };
  }, [isUnlocked, settings.autoLockSeconds, lock]);
}
