import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';

const LAST_UPDATED = 'July 18, 2026';

const SECTIONS = [
  {
    title: '1. Overview',
    body: `Vaultora ("we", "our", or "the App") is an on-device encrypted media vault. We are committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights.

By using Vaultora you agree to this Privacy Policy. If you do not agree, please uninstall the App.`,
  },
  {
    title: '2. Data We Collect',
    body: `Vaultora is designed to collect as little data as possible.

On-Device Only:
• Media files (photos and videos) you import — stored exclusively on your device in an encrypted container.
• Vault configuration (PIN hash, recovery key hash, settings) — stored on-device using iOS Keychain and AsyncStorage. These values are never transmitted.
• App usage data — no analytics, no crash reporting, no telemetry is collected.

We Do Not Collect:
• Personal identification information (name, email, phone number).
• Location data.
• Behavioral analytics or usage statistics.
• Advertising identifiers (IDFA, IDFV).`,
  },
  {
    title: '3. How We Use Your Data',
    body: `All data processing occurs exclusively on your device. We do not transmit, sell, share, or have access to your vault contents or settings.

The App accesses:
• Photo Library — only when you explicitly trigger an import. We read only the files you select; we do not scan your library.
• Face ID / Touch ID — only to authenticate vault access. Biometric data never leaves the Secure Enclave.
• iCloud (Premium) — if you enable encrypted backup, your vault files are encrypted on-device before upload to your private iCloud container. We cannot access your iCloud data.`,
  },
  {
    title: '4. Data Storage & Security',
    body: `Your media is protected by AES-256-GCM encryption. Your PIN is never stored in plain text; only a salted SHA-256 hash is kept in the iOS Keychain.

Your vault directory is excluded from device backups by default unless you explicitly enable iCloud backup. When iCloud backup is enabled, all data is encrypted before upload and only decryptable with your vault key.`,
  },
  {
    title: '5. Third-Party Services',
    body: `Vaultora does not integrate with any third-party analytics, advertising, or tracking services.

The App uses the following iOS system frameworks, which are subject to Apple's privacy policies:
• AVFoundation — video playback.
• PhotoKit / MediaLibrary — importing and exporting media.
• LocalAuthentication — Face ID / Touch ID.
• CloudKit (Premium) — encrypted iCloud backup.
• StoreKit — in-app purchases.

No data is shared with these frameworks beyond what is required to provide the respective functionality.`,
  },
  {
    title: '6. Children\'s Privacy',
    body: `Vaultora is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, contact us immediately at the address below.`,
  },
  {
    title: '7. Data Retention & Deletion',
    body: `Your data lives on your device and is under your control at all times.

To delete all vault data:
1. Open Settings in Vaultora.
2. Scroll to "Danger Zone".
3. Tap "Reset Vault".

This permanently and irreversibly deletes all encrypted vault files, your PIN hash, recovery key hash, and all settings. Uninstalling the App will also remove all locally stored data. If you have enabled iCloud backup, you must also manually delete the Vaultora data from your iCloud Drive.`,
  },
  {
    title: '8. Your Rights (GDPR & CCPA)',
    body: `Because Vaultora does not collect personal data from you or transmit it to our servers, most GDPR and CCPA rights (access, portability, correction, deletion) are exercised directly on your device.

If you are a resident of the European Economic Area or California and have questions about your rights, contact us at the address below. We will respond within 30 days.`,
  },
  {
    title: '9. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. When we do, we will update the "Last Updated" date and notify you via an in-app notice. Continued use of the App after changes constitutes acceptance of the updated Policy.`,
  },
  {
    title: '10. Contact Us',
    body: `If you have questions, concerns, or complaints about this Privacy Policy or our data practices, contact us at:

Email: privacy@vaultora.app
Support: https://vaultora.app/support

We take all privacy inquiries seriously and will respond within 48 hours.`,
  },
];

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Privacy Policy</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.metaBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#4CAF87" />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            Last updated: {LAST_UPDATED}
          </Text>
        </View>

        <View style={[styles.summaryBox, { backgroundColor: 'rgba(76,175,135,0.08)', borderColor: 'rgba(76,175,135,0.25)' }]}>
          <Text style={[styles.summaryTitle, { color: '#4CAF87' }]}>Plain-English Summary</Text>
          <Text style={[styles.summaryText, { color: colors.foreground }]}>
            • We have no servers. Your vault never leaves your device.{'\n'}
            • We never see your photos, videos, or PIN.{'\n'}
            • No ads, no tracking, no analytics — ever.{'\n'}
            • You can delete everything from Settings → Reset Vault.
          </Text>
        </View>

        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{s.title}</Text>
            <Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  content: { padding: 20, gap: 20 },
  metaBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth,
  },
  metaText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  summaryBox: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 8 },
  summaryTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  summaryText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  sectionBody: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 24 },
});
