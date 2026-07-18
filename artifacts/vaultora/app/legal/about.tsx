import React from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

const openURL = (url: string) => {
  Linking.openURL(url).catch(() =>
    Alert.alert('Cannot open URL', 'Please visit ' + url + ' in your browser.')
  );
};

const LINKS = [
  { icon: 'star-outline', label: 'Rate Vaultora', color: '#F5A623', onPress: () => openURL('https://apps.apple.com/app/id0000000000?action=write-review') },
  { icon: 'chatbubble-outline', label: 'Contact Support', color: '#5E9EFA', onPress: () => openURL('mailto:support@vaultora.app') },
  { icon: 'globe-outline', label: 'Website', color: '#4CAF87', onPress: () => openURL('https://vaultora.app') },
  { icon: 'bug-outline', label: 'Report a Bug', color: '#9B59B6', onPress: () => openURL('mailto:bugs@vaultora.app?subject=Bug%20Report%20-%20Vaultora%20' + APP_VERSION) },
  { icon: 'shield-checkmark-outline', label: 'Security Disclosure', color: '#E05555', onPress: () => openURL('mailto:security@vaultora.app') },
];

const TECH = [
  { name: 'React Native', license: 'MIT', url: 'https://github.com/facebook/react-native' },
  { name: 'Expo SDK', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'expo-image', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'expo-router', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'expo-av', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: '@expo-google-fonts/inter', license: 'OFL', url: 'https://fonts.google.com/specimen/Inter' },
  { name: 'js-sha256', license: 'MIT', url: 'https://github.com/emn178/js-sha256' },
  { name: '@react-native-async-storage', license: 'MIT', url: 'https://github.com/react-native-async-storage' },
];

export default function AboutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>About</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {/* App identity */}
        <View style={styles.appHero}>
          <LinearGradient colors={['rgba(196,151,90,0.2)', 'transparent']} style={styles.iconGlow}>
            <View style={[styles.iconBg, { backgroundColor: 'rgba(196,151,90,0.15)', borderColor: 'rgba(196,151,90,0.3)' }]}>
              <Ionicons name="shield-checkmark" size={44} color="#C4975A" />
            </View>
          </LinearGradient>
          <Text style={[styles.appName, { color: colors.foreground }]}>Vaultora</Text>
          <Text style={[styles.appTagline, { color: '#C4975A' }]}>Your private vault</Text>
          <View style={[styles.versionBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
              Version {APP_VERSION} (Build {BUILD_NUMBER})
            </Text>
          </View>
        </View>

        {/* Commitment */}
        <View style={[styles.commitmentCard, { backgroundColor: 'rgba(76,175,135,0.07)', borderColor: 'rgba(76,175,135,0.2)' }]}>
          <Text style={[styles.commitmentTitle, { color: '#4CAF87' }]}>Our Promise</Text>
          <Text style={[styles.commitmentText, { color: colors.mutedForeground }]}>
            Vaultora was built with one goal: give you a place where your most private photos and videos are truly private. No servers. No tracking. No ads. Your files stay on your device, encrypted with keys only you hold.
          </Text>
        </View>

        {/* Links */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>GET IN TOUCH</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {LINKS.map((link, i) => (
              <React.Fragment key={i}>
                <Pressable
                  onPress={link.onPress}
                  style={({ pressed }) => [styles.linkRow, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <View style={[styles.linkIcon, { backgroundColor: `${link.color}18` }]}>
                    <Ionicons name={link.icon as any} size={18} color={link.color} />
                  </View>
                  <Text style={[styles.linkLabel, { color: colors.foreground }]}>{link.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
                </Pressable>
                {i < LINKS.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: 58 }]} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Open source */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>OPEN-SOURCE COMPONENTS</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {TECH.map((t, i) => (
              <React.Fragment key={i}>
                <Pressable
                  onPress={() => openURL(t.url)}
                  style={({ pressed }) => [styles.techRow, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={[styles.techName, { color: colors.foreground }]}>{t.name}</Text>
                  <Text style={[styles.techLicense, { color: colors.mutedForeground }]}>{t.license}</Text>
                </Pressable>
                {i < TECH.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: 16 }]} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        <Text style={[styles.copyright, { color: colors.mutedForeground }]}>
          © {new Date().getFullYear()} Vaultora{'\n'}
          Made with care for your privacy
        </Text>
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
  content: { padding: 20, gap: 24 },
  appHero: { alignItems: 'center', gap: 8 },
  iconGlow: { borderRadius: 40, padding: 6 },
  iconBg: { width: 90, height: 90, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  appName: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  appTagline: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  versionBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
  versionText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  commitmentCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 8 },
  commitmentTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  commitmentText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  sectionBlock: { gap: 8 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, paddingHorizontal: 4 },
  card: { borderRadius: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  linkIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  divider: { height: StyleSheet.hairlineWidth },
  techRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  techName: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  techLicense: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  copyright: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
});
