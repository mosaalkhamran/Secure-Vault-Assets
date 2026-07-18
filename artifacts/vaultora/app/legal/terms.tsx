import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';

const LAST_UPDATED = 'July 18, 2026';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By downloading, installing, or using Vaultora ("the App"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, do not use the App.

These Terms apply to all users of the App, including without limitation users who are browsers, customers, merchants, and/or contributors of content.`,
  },
  {
    title: '2. License Grant',
    body: `Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to download and use the App solely for your personal, non-commercial purposes on Apple-branded devices that you own or control, and as permitted by the App Store Terms of Service.

You may not: (a) copy or redistribute the App; (b) reverse-engineer, decompile, or disassemble the App; (c) modify or create derivative works; (d) use the App for any commercial purpose; (e) remove any proprietary notices.`,
  },
  {
    title: '3. User Responsibilities',
    body: `You are solely responsible for:
• All content you import into the App (photos, videos, and other media).
• Maintaining the confidentiality of your PIN and Recovery Key.
• All activities that occur under your vault.

You agree not to use the App to store, share, or transmit any content that: (a) is illegal or facilitates illegal activity; (b) infringes any intellectual property rights; (c) contains child sexual abuse material or other exploitation of minors; (d) constitutes harassment, abuse, or threats.

We reserve the right to terminate your access if we become aware of prohibited use.`,
  },
  {
    title: '4. PIN & Recovery Key',
    body: `Your PIN and Recovery Key are the sole means of accessing your vault. We do not store your PIN or Recovery Key in any form that would allow us to recover them.

If you lose both your PIN and your 24-word Recovery Key, your vault contents are permanently inaccessible. We cannot recover your data under any circumstances. You are solely responsible for securely backing up your Recovery Key.`,
  },
  {
    title: '5. Premium Subscription',
    body: `Vaultora offers a premium subscription ("Premium") that unlocks additional features. Premium is offered as a monthly auto-renewing subscription through Apple In-App Purchase.

• Payment will be charged to your Apple ID account.
• Your subscription automatically renews unless you cancel at least 24 hours before the end of the current period.
• You may manage or cancel your subscription in your Apple ID Account Settings.
• No refunds are provided for partial subscription periods, except as required by applicable law.

Premium features include iCloud encrypted backup, alternative app icons, and the Privacy Cover. Features may change over time.`,
  },
  {
    title: '6. iCloud Backup (Premium)',
    body: `When you enable iCloud Backup, your vault files are encrypted on-device before being uploaded to your personal iCloud account. We do not have access to your iCloud data.

You are responsible for your iCloud storage capacity. We are not liable for data loss due to iCloud service failures, account suspension, or storage limits.`,
  },
  {
    title: '7. Disclaimer of Warranties',
    body: `THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.

We do not warrant that: (a) the App will be uninterrupted or error-free; (b) defects will be corrected; (c) the App or its servers are free of viruses or harmful components; (d) the App will meet your requirements.`,
  },
  {
    title: '8. Limitation of Liability',
    body: `TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF DATA, arising out of or in connection with your use of the App, even if we have been advised of the possibility of such damages.

OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE APP IN THE 12 MONTHS PRECEDING THE CLAIM.`,
  },
  {
    title: '9. Indemnification',
    body: `You agree to indemnify and hold harmless Vaultora and its affiliates, officers, agents, and employees from any claim, liability, damage, loss, and expense (including legal fees) arising from: (a) your use of the App; (b) your violation of these Terms; (c) your violation of any rights of another party; (d) content you import into the App.`,
  },
  {
    title: '10. Governing Law',
    body: `These Terms are governed by the laws of the applicable jurisdiction, without regard to conflict of law provisions. Any disputes arising under these Terms will be subject to the exclusive jurisdiction of the courts in such jurisdiction.`,
  },
  {
    title: '11. Changes to Terms',
    body: `We reserve the right to modify these Terms at any time. We will notify you of material changes via an in-app notice and update the "Last Updated" date. Your continued use of the App after changes constitutes acceptance of the new Terms.`,
  },
  {
    title: '12. Contact',
    body: `For questions about these Terms, contact us:

Email: legal@vaultora.app
Support: https://vaultora.app/support`,
  },
];

export default function TermsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Terms of Use</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.metaBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            Last updated: {LAST_UPDATED}
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
  section: { gap: 8 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  sectionBody: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 24 },
});
