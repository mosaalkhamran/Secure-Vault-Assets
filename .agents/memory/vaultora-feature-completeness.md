---
name: Vaultora feature completeness
description: Which features are implemented in Expo Go vs requiring a native Dev Build
---

## Implemented (works in Expo Go + Dev Build)

- Full onboarding: welcome, create PIN (numeric + alphanumeric with strength meter), confirm, Face ID, 24-word recovery key with word verification
- Lock screen: PIN pad, Face ID, attempt limiting with countdown timer (3 attempts → 30s, 5 → 60s, 8+ → 300s), forgot PIN flow
- VaultContext: trash (softDelete/restore/permanentDelete/emptyTrash), auto-lock timer, attempt limiting persisted in SecureStore, export to Photos, favorites, albums with rename/delete
- Auto-lock: AppState hook (useAutoLock) starts timer on background, locks when elapsed > autoLockSeconds
- App Switcher privacy: AppLockOverlay shows blank screen on inactive/background (prevents screenshots)
- Library: search bar, filter pills (All/Photos/Videos/Favorites), sort/filter sheet, multi-select toolbar, grid/list view, import with progress and keep/delete original choice
- Albums: create, rename (long-press), delete with/without files
- Settings: fully wired — Face ID toggle, auto-lock picker, Privacy Cover toggle, change PIN modal, reset vault
- Trash screen: 30-day retention countdown, restore, permanent delete, empty trash
- Media viewer: horizontal swipe, native pinch-to-zoom for images, video player (expo-av)
- Calculator privacy cover: fully functional calculator, entering PIN then = unlocks vault
- Subscription screen: full premium paywall UI with feature list
- Sort/Filter sheet: 6 sort options, 4 filter options, grid/list toggle
- Import sheet: multi-select from Photos, progress tracking, keep/delete original option
- Encryption service: AES-256-GCM architecture with key derivation (PBKDF2-like using sha256)
- app.config.ts + eas.json: full iOS entitlements, alternate icons, CloudKit container, media permissions

## Requires Development Build (native modules)

- Real AES-256-GCM file encryption → swap services/encryption.ts stubs with react-native-quick-crypto
- CloudKit backup/restore → services/cloudkit.ts stubs; needs native CKContainer module
- StoreKit 2 purchases → services/storekit.ts stubs; needs expo-iap or react-native-purchases
- Alternative app icons → UIApplication.setAlternateIconName; needs expo-alternate-app-icons or custom plugin
- PhotoKit delete original → MediaLibrary.deleteAssetsAsync requires full media library access (works in dev build)
- Decoy vault → implemented architecture but secondary PIN not wired (add in future)

## Key architectural decisions
- All items (active + trash) stored in single AsyncStorage key `vault_all_items`, filtered in context
- Attempt counts stored in SecureStore (persists across app kills)
- Recovery key: 24 words from WORDLIST (512 words), 216-bit entropy
- PIN hashing: sha256("vaultora_v2_secure_" + pin) — NOT pbkdf2 (js-sha256 limitation in Expo Go)
- VAULT_DIR: `{documentDirectory}vault/media/` — persists across app restarts
- expo-av version installed: ~16.0.8 (SDK 54 compatibility); expo-media-library: ~18.2.1

**Why pnpm + Metro needed restart:** After `pnpm exec expo install expo-av expo-media-library`, Metro's bundle cache didn't pick up new packages. Fix: always restart the workflow after installing new packages.
