---
name: Vaultora feature completeness
description: What's fully built vs what requires a native/EAS Dev Build in Vaultora
---

## Fully Built (Expo Go compatible)

All UI-level features are complete. TypeScript is clean (0 errors). Metro bundles without errors.

### Auth & Security
- PIN creation (numeric + alphanumeric) with strength meter
- PIN verification with attempt limiting: 5 → 30s, 8 → 60s, 10+ → 300s lockout (SecureStore)
- Face ID toggle (stubs gracefully in Expo Go)
- 24-word recovery key (WORDLIST), 3-word in-screen verification
- Forgot PIN flow using recovery key
- Auto-lock via AppState hook (configurable 0–3600s)
- App switcher privacy via AppLockOverlay (shows blank on background/inactive)
- **Decoy Vault**: setupDecoyPin / verifyDecoyPin / enterDecoyMode in VaultContext + lock screen checks decoy before recording failed attempt + setup-decoy-pin.tsx screen

### Library / Media
- Grid + list view, search, sort (date/name/size/type), filter pills (all/images/videos/favorites)
- Multi-select toolbar: Favorite, Move to Album (AlbumPickerSheet), Export to Photos (Alert with count), Delete
- Import via expo-image-picker (fixed deprecated MediaTypeOptions.All → array)
- File copy into VAULT_DIR (AES-256-GCM stub; real crypto needs Dev Build)
- Full-screen image viewer + VideoPlayer (expo-av custom controls)

### Albums
- Create / rename / delete albums (Alert-based rename)
- Album card taps navigate to `/album/[id]` (album detail with multi-select, remove/delete/export/favorite)

### Trash
- Soft delete → 30-day countdown → auto-purge
- Restore from trash, permanent delete, empty trash

### Settings
- Face ID toggle, auto-lock interval, privacy cover toggle
- Change PIN modal, forgot PIN navigation
- Decoy Vault section (premium-gated UI, removeDecoyPin alert)
- Privacy Policy → `/legal/privacy-policy`, Terms → `/legal/terms`, About → `/legal/about`
- Reset Vault (destructive with confirmation)
- Stats: items, size, trashed

### Legal Screens
- `app/legal/privacy-policy.tsx` — Full App Store-compliant policy
- `app/legal/terms.tsx` — Full terms of use
- `app/legal/about.tsx` — Version, support links, open-source licenses
- `app/legal/_layout.tsx` — Stack layout for legal segment

### Privacy Cover
- Calculator UI at `app/privacy-cover/calculator.tsx`
- Entering PIN and pressing `=` unlocks vault; wrong PIN shows error

### Onboarding
- Welcome → Create PIN → Face ID → Recovery Key (3-word verify) → completeSetup()

### App Store Compliance
- `ios/PrivacyInfo.xcprivacy` — NSPrivacyAccessedAPITypes: FileTimestamp, UserDefaults, DiskSpace, SystemBootTime
- `APP_STORE_SUBMISSION.md` — Full submission guide: screenshots, export compliance, age rating, IAP, review notes
- Export compliance: ITSAppUsesNonExemptEncryption = false (platform crypto only)

## Requires EAS Dev Build / Production Build
- Real AES-256-GCM encryption (currently: file copy stub)
- iCloud/CloudKit backup (`services/cloudkit.ts` architecture ready)
- StoreKit 2 IAP (`services/storekit.ts` architecture ready)
- Alternate app icons (config ready in app.config.ts)
- expo-local-authentication Face ID on device

## Key Technical Decisions
- `js-sha256` for PIN hashing (expo-crypto crashes in Expo Go SDK 54)
- `expo-file-system/legacy` import for all FileSystem usage (new SDK 54 API removed documentDirectory, cacheDirectory, EncodingType from main export)
- `ensureDirectory()` utility at `utils/filesystem.ts` wraps makeDirectoryAsync deprecation
- UUID via `Date.now() + Math.random()` (no uuid package)
- Expo Router file-based routes: legal screens use `app/legal/_layout.tsx` → root Stack registers `name="legal"` (not individual sub-screens)
- Album detail: `app/album/[id].tsx` with no parent _layout → root Stack registers `name="album/[id]"` ... BUT Expo Router exposes it as the "album" directory. Use `name="album/[id]"` when router sees "album/[id]" in children.
