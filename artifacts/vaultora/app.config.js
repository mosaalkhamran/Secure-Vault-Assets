module.exports = ({ config }) => ({
  ...config,
  name: 'Vaultora',
  slug: 'vaultora',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'vaultora',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  splash: {
    image: './assets/images/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0A12',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.vaultora.app',
    buildNumber: '1',
    usesAppleSignIn: false,
    entitlements: {
      'com.apple.developer.icloud-container-identifiers': ['iCloud.com.vaultora.app'],
      'com.apple.developer.ubiquity-kvstore-identifier': 'com.vaultora.app',
      'com.apple.developer.icloud-services': ['CloudKit'],
    },
    infoPlist: {
      NSPhotoLibraryUsageDescription:
        'Vaultora needs access to your photo library to import media into your vault.',
      NSPhotoLibraryAddUsageDescription:
        'Vaultora needs permission to save media back to your photo library.',
      NSCameraUsageDescription:
        'Vaultora needs camera access to take photos directly into your vault.',
      NSFaceIDUsageDescription:
        'Vaultora uses Face ID to quickly unlock your vault without entering your PIN.',
      UIFileSharingEnabled: false,
      LSSupportsOpeningDocumentsInPlace: false,
    },
    alternateIcons: {
      calculator: { image: './assets/icons/calculator', prerendered: true },
      folder:     { image: './assets/icons/folder',     prerendered: true },
      notebook:   { image: './assets/icons/notebook',   prerendered: true },
    },
  },
  android: {
    permissions: [
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'USE_BIOMETRIC',
      'USE_FINGERPRINT',
    ],
  },
  web: {
    favicon: './assets/images/icon.png',
  },
  plugins: [
    // expo-router بدون أي origin خارجي — التطبيق مستقل تماماً
    'expo-router',
    'expo-font',
    'expo-web-browser',
    [
      'expo-image-picker',
      {
        photosPermission:
          'Vaultora needs access to your photos to import them into your vault.',
        cameraPermission:
          'Vaultora needs camera access to take photos directly into your vault.',
      },
    ],
    [
      'expo-local-authentication',
      {
        faceIDPermission: 'Vaultora uses Face ID to unlock your vault.',
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission:
          'Vaultora needs access to your photo library.',
        savePhotosPermission:
          'Vaultora needs permission to save files back to your photo library.',
        isAccessMediaLocationEnabled: true,
      },
    ],
    [
      'expo-av',
      {
        microphonePermission: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    cloudKitContainer: 'iCloud.com.vaultora.app',
    subscriptionProductId: 'com.vaultora.premium.monthly',
  },
});
