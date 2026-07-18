/**
 * AppLockOverlay — shows a blank screen in App Switcher / when app goes to background.
 * Prevents vault contents from appearing in screenshots and task switcher thumbnails.
 */
import React, { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View, AppStateStatus } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AppLockOverlay() {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'inactive') {
        // Show immediately when going inactive (screenshot / switcher)
        setShowOverlay(true);
      } else if (state === 'active') {
        setShowOverlay(false);
      } else if (state === 'background') {
        setShowOverlay(true);
      }
    });
    return () => sub.remove();
  }, []);

  if (!showOverlay) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.iconContainer}>
        <Ionicons name="shield-checkmark" size={48} color="#C4975A" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A12',
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(196,151,90,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
