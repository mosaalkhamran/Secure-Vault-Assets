import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';

const FEATURES = [
  { icon: 'cloud-outline', title: 'iCloud Encrypted Backup', desc: 'Encrypted backup to your private iCloud. Restore after device reset or on a new iPhone.' },
  { icon: 'refresh-outline', title: 'Automatic Backup', desc: 'Vault syncs automatically in the background. Resumes where it left off.' },
  { icon: 'checkmark-circle-outline', title: 'Backup Verification', desc: 'Every file is verified after upload. Integrity checked on restore.' },
  { icon: 'shield-half-outline', title: 'Privacy Cover', desc: 'Calculator, notes, clock — disguise Vaultora as another app.' },
  { icon: 'apps-outline', title: 'Alternative Icons', desc: 'Change app icon to a calculator, folder, notebook, and more.' },
  { icon: 'lock-closed-outline', title: 'Decoy Vault', desc: 'Secondary PIN opens a separate vault with different content.' },
  { icon: 'eye-off-outline', title: 'Advanced Lock', desc: 'Instant lock on background, biometric enforcement, and more.' },
];

export default function SubscriptionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      {/* Close */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.closeBtn, { top: insets.top + 12 }]}
      >
        <Ionicons name="close" size={22} color={colors.mutedForeground} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={['#C4975A', '#E8BE78']}
            style={styles.premiumBadge}
          >
            <Text style={styles.premiumBadgeText}>PREMIUM</Text>
          </LinearGradient>
          <Text style={[styles.title, { color: colors.foreground }]}>Vaultora Premium</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Everything you need to keep your memories truly private
          </Text>
        </View>

        {/* Price */}
        <View style={[styles.priceCard, { backgroundColor: 'rgba(196,151,90,0.1)', borderColor: 'rgba(196,151,90,0.3)' }]}>
          <Text style={[styles.priceAmount, { color: '#C4975A' }]}>$9</Text>
          <View>
            <Text style={[styles.pricePer, { color: colors.foreground }]}>per month</Text>
            <Text style={[styles.priceNote, { color: colors.mutedForeground }]}>
              Auto-renews · Cancel anytime
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, { borderBottomColor: colors.border, borderBottomWidth: i < FEATURES.length - 1 ? StyleSheet.hairlineWidth : 0 }]}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(196,151,90,0.15)' }]}>
                <Ionicons name={f.icon as any} size={20} color="#C4975A" />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Free tier reminder */}
        <View style={[styles.freeNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
          <Text style={[styles.freeNoteText, { color: colors.mutedForeground }]}>
            All local features — import, view, albums, favorites — remain free forever. Your files are never locked or deleted if you cancel.
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.subscribeBtn, { backgroundColor: '#C4975A', opacity: pressed ? 0.85 : 1 }]}
            onPress={() => {
              // StoreKit purchase — requires Development Build
              // In production: call StoreKit 2 purchase flow
              router.back();
            }}
          >
            <Text style={styles.subscribeBtnText}>Subscribe · $9 / month</Text>
          </Pressable>
          <Pressable style={styles.restoreBtn} onPress={() => {}}>
            <Text style={[styles.restoreBtnText, { color: colors.mutedForeground }]}>Restore Purchases</Text>
          </Pressable>
        </View>

        {/* Legal */}
        <Text style={[styles.legal, { color: colors.mutedForeground }]}>
          Subscription auto-renews monthly at the price shown for your App Store region. Cancel anytime in Settings → Apple ID. Payment charged to your Apple ID account. Subscription to Vaultora Premium includes all listed premium features.
        </Text>
        <View style={styles.legalLinks}>
          <Pressable>
            <Text style={[styles.legalLink, { color: colors.mutedForeground }]}>Privacy Policy</Text>
          </Pressable>
          <Text style={[styles.legalDot, { color: colors.mutedForeground }]}>·</Text>
          <Pressable>
            <Text style={[styles.legalLink, { color: colors.mutedForeground }]}>Terms of Use</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: { position: 'absolute', right: 16, zIndex: 10, padding: 8 },
  content: { paddingHorizontal: 24, gap: 20 },
  headerSection: { alignItems: 'center', gap: 12 },
  premiumBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  premiumBadgeText: { color: '#0A0A12', fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  priceCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 20, borderWidth: 1 },
  priceAmount: { fontSize: 52, fontFamily: 'Inter_700Bold' },
  pricePer: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  priceNote: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  featureList: { borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)' },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  featureDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18, marginTop: 2 },
  freeNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  freeNoteText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  actions: { gap: 12 },
  subscribeBtn: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  subscribeBtnText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#0A0A12' },
  restoreBtn: { alignItems: 'center', padding: 8 },
  restoreBtnText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  legal: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 16 },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', gap: 8, alignItems: 'center' },
  legalLink: { fontSize: 12, fontFamily: 'Inter_400Regular', textDecorationLine: 'underline' },
  legalDot: { fontSize: 12 },
});
