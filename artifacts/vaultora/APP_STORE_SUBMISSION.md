# Vaultora — App Store Submission Guide

## App Information
- **Name:** Vaultora — Private Vault
- **Subtitle:** Encrypted Photo & Video Safe
- **Bundle ID:** com.vaultora.app
- **Version:** 1.0.0 (Build 1)
- **Primary Category:** Productivity
- **Secondary Category:** Photo & Video
- **Age Rating:** 4+
- **Price:** Free (with In-App Purchase)

---

## App Description

### Short Description (30 chars)
Encrypted photo & video vault

### Full Description
Vaultora is the most private vault for your photos and videos. Military-grade AES-256-GCM encryption protects every file. Your data never leaves your device.

**Why Vaultora?**
Unlike other vault apps, Vaultora has no servers. No one — not even the developer — can access your files. Your encryption key lives only in your hands.

**Key Features**
🔒 AES-256-GCM encryption — the same standard used by governments and banks
👁️ Privacy Cover — choose a calculator or other cover screen instead of showing the vault
📱 Face ID / Touch ID unlock — instant access without entering your PIN every time
🗂️ Albums & organization — sort, filter, and organize by date, size, or name
🗑️ 30-day trash — accidentally deleted files recovered anytime
☁️ Encrypted iCloud Backup (Premium) — your files, encrypted, in your iCloud
🕵️ Decoy Vault (Premium) — a secret fake vault that looks real but contains nothing
⏱️ Auto-lock — configurable from immediately to never
📋 Recovery Key — 24-word recovery phrase if you forget your PIN

**Premium Features**
- Encrypted iCloud Backup
- Decoy Vault (dual PIN)
- Alternative App Icons
- Priority Support

**Your Privacy, Guaranteed**
• No ads, no tracking, no analytics
• No account required — ever
• All data stored locally on your device
• Open about what permissions we use and why

### Keywords
vault,photo lock,privacy,encrypted,secret,secure photos,hide photos,private gallery,encryption,secure

---

## Screenshots Required (iOS)
- **6.9" (iPhone 16 Pro Max):** 1320 × 2868 px — Required
- **6.7" (iPhone 15 Plus):** 1290 × 2796 px — Required
- **6.5" (iPhone 11 Pro Max):** 1242 × 2688 px — Optional
- **5.5" (iPhone 8 Plus):** 1242 × 2208 px — Optional

### Recommended Screenshot Sequence
1. Lock screen with Vaultora shield and PIN pad
2. Library with photos (use demo content) — show grid
3. Image viewer with controls
4. Privacy Cover (calculator)
5. Settings screen showing security options
6. Albums view

---

## Privacy Policy URL
https://vaultora.app/privacy

## Terms of Service URL
https://vaultora.app/terms

## Support URL
https://vaultora.app/support

## Marketing URL
https://vaultora.app

---

## In-App Purchases

### Premium Monthly Subscription
- **Product ID:** com.vaultora.premium.monthly
- **Reference Name:** Vaultora Premium Monthly
- **Price Tier:** Tier 9 ($8.99/month)
- **Display Name:** Vaultora Premium
- **Description:** Unlock encrypted iCloud backup, Decoy Vault, and alternative app icons.

---

## Review Information

### Demo Account
Not required — no accounts in this app.

### Notes for Reviewer
Vaultora is a local encrypted media vault. To test:
1. Launch the app → tap "Get Started" → create a 6-digit PIN
2. Tap "Skip for now" on Face ID step
3. Note your 24-word recovery key, verify 3 words to proceed
4. You are now in the vault. Tap the "+" button to import media
5. Privacy Policy and Terms of Use are in Settings → About & Support

**Privacy Cover (Calculator):**  
Settings → Privacy Cover → Enable → Preview Cover  
The calculator appears. Enter your PIN then press "=" to unlock.

**Decoy Vault:**  
Settings → Decoy Vault → Set Up Decoy PIN  
Set a different PIN. Lock the vault, then enter the decoy PIN on the lock screen → vault appears empty.

**iCloud Backup, StoreKit (Premium):**  
These features are stubbed for the Expo Go build and fully functional in the EAS production build. Please test on the production build.

---

## Export Compliance
- **Uses Encryption:** YES
- **Exempt from EAR (15 CFR 740.13):** YES — Uses only standard iOS/Apple-provided encryption (CommonCrypto/CryptoKit via iOS frameworks). The app does not implement any custom encryption algorithms and is exempt under TSU/ENC exception.
- **Encryption Type:** AES-256-GCM (Apple CryptoKit / CommonCrypto — platform APIs only)

---

## Content Rights
All media content shown in screenshots is original or royalty-free. The app does not distribute or transmit user content.

---

## Third-Party SDK Privacy Details

| SDK | Purpose | Data Collected | Tracking |
|-----|---------|----------------|---------|
| React Native | UI framework | None | No |
| Expo SDK | Platform tools | None | No |
| expo-av | Video playback | None | No |
| expo-image-picker | Media import | None | No |
| expo-local-authentication | Face ID | None (Secure Enclave only) | No |
| js-sha256 | PIN hashing | None | No |

---

## Permissions Used

| Permission | Key | Reason |
|-----------|-----|--------|
| Photo Library Read | NSPhotoLibraryUsageDescription | Import photos and videos into the encrypted vault |
| Photo Library Add | NSPhotoLibraryAddUsageDescription | Export decrypted files back to Photos app |
| Face ID | NSFaceIDUsageDescription | Biometric authentication to unlock the vault |
| Camera (optional) | NSCameraUsageDescription | Take photos directly into the vault (future) |

---

## Rejection Risk Checklist

| Risk | Status | Notes |
|------|--------|-------|
| Privacy Policy URL | ✅ | https://vaultora.app/privacy |
| Terms of Service URL | ✅ | https://vaultora.app/terms |
| In-app Privacy Policy | ✅ | Settings → Privacy Policy |
| In-app Terms | ✅ | Settings → Terms of Use |
| NSPrivacyAccessedAPITypes | ✅ | PrivacyInfo.xcprivacy included |
| Permission strings accurate | ✅ | See above table |
| No private APIs | ✅ | Only public iOS frameworks |
| No tracking/analytics | ✅ | No third-party analytics |
| Export compliance declared | ✅ | Platform crypto only |
| Age rating appropriate | ✅ | 4+ (no user-generated content transmitted) |
| In-app purchase described | ✅ | Premium features listed |
| No misleading screenshots | ✅ | Use real app screenshots |
| Support URL accessible | ✅ | https://vaultora.app/support |
| Crashes on review device | ⚠️ | Test on real device before submission |
| App works without internet | ✅ | Fully offline |
