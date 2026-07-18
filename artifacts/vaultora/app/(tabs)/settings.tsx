import React, { useState } from 'react';
import {
  Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/contexts/VaultContext';
import PinPad from '@/components/PinPad';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    settings, vaultItems, trashedItems, lock, resetVault,
    updateSettings, enableFaceId, disableFaceId, isFaceIdAvailable,
    createPin,
  } = useVault();

  const [showChangePinModal, setShowChangePinModal] = useState(false);

  const totalBytes = vaultItems.reduce((s, i) => s + i.size, 0);
  const formatSize = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const AUTO_LOCK_OPTIONS = [
    { label: 'Immediately', value: 0 },
    { label: '15 seconds', value: 15 },
    { label: '30 seconds', value: 30 },
    { label: '1 minute', value: 60 },
    { label: '5 minutes', value: 300 },
    { label: 'Never', value: -1 },
  ];

  const handleAutoLock = () => {
    Alert.alert(
      'Auto-lock',
      'Lock vault after:',
      AUTO_LOCK_OPTIONS.map(o => ({
        text: o.label + (settings.autoLockSeconds === o.value ? ' ✓' : ''),
        onPress: () => updateSettings({ autoLockSeconds: o.value }),
      })).concat([{ text: 'Cancel', onPress: () => {} }])
    );
  };

  const handleFaceIdToggle = async (enabled: boolean) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (enabled) {
      const ok = await enableFaceId();
      if (!ok) Alert.alert('Face ID', 'Could not enable Face ID. Please try again.');
    } else {
      await disableFaceId();
    }
  };

  const handleResetVault = () => {
    Alert.alert('Reset Vault', 'This permanently deletes all vault data, your PIN, and keys. Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset Vault', style: 'destructive',
        onPress: () =>
          Alert.alert('Final Confirmation', 'Delete everything forever?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete Everything', style: 'destructive', onPress: () => resetVault() },
          ]),
      },
    ]);
  };

  const autoLockLabel = AUTO_LOCK_OPTIONS.find(o => o.value === settings.autoLockSeconds)?.label ?? '5 minutes';

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Vault Stats */}
        <Section title="VAULT">
          <Row icon="images-outline" iconColor={colors.primary} label="Photos" value={String(vaultItems.filter(i => i.type === 'photo').length)} colors={colors} />
          <Divider colors={colors} />
          <Row icon="videocam-outline" iconColor={colors.primary} label="Videos" value={String(vaultItems.filter(i => i.type === 'video').length)} colors={colors} />
          <Divider colors={colors} />
          <Row icon="server-outline" iconColor={colors.primary} label="Storage Used" value={formatSize(totalBytes)} colors={colors} />
          {trashedItems.length > 0 && <><Divider colors={colors} />
          <Row icon="trash-outline" iconColor={colors.destructive} label="Deleted Items" value={String(trashedItems.length)} onPress={() => router.push('/trash')} colors={colors} /></>}
        </Section>

        {/* Security */}
        <Section title="SECURITY">
          <Row icon="keypad-outline" iconColor="#5E9EFA" label="Change PIN" onPress={() => setShowChangePinModal(true)} colors={colors} chevron />
          <Divider colors={colors} />
          {isFaceIdAvailable && <>
            <Row
              icon="scan-outline" iconColor="#5E9EFA" label="Face ID"
              toggle={settings.faceIdEnabled}
              onToggle={handleFaceIdToggle}
              colors={colors}
            />
            <Divider colors={colors} />
          </>}
          <Row icon="timer-outline" iconColor="#5E9EFA" label="Auto-lock" value={autoLockLabel} onPress={handleAutoLock} colors={colors} chevron />
        </Section>

        {/* Privacy */}
        <Section title="PRIVACY">
          <Row
            icon="eye-off-outline" iconColor="#9B59B6"
            label="Privacy Cover"
            description="Show calculator instead of vault"
            toggle={settings.privacyCoverEnabled}
            onToggle={v => updateSettings({ privacyCoverEnabled: v })}
            colors={colors}
            premium={!settings.isPremium}
          />
          {settings.privacyCoverEnabled && <>
            <Divider colors={colors} />
            <Row
              icon="calculator-outline" iconColor="#9B59B6"
              label="Cover Type" value="Calculator"
              onPress={() => router.push('/privacy-cover/calculator')}
              colors={colors} chevron
            />
            <Divider colors={colors} />
            <Row
              icon="eye-outline" iconColor="#9B59B6"
              label="Preview Cover"
              onPress={() => router.push('/privacy-cover/calculator')}
              colors={colors} chevron
            />
          </>}
        </Section>

        {/* Recovery */}
        <Section title="RECOVERY">
          <Row icon="key-outline" iconColor="#F5A623" label="View Recovery Key" onPress={() => router.push('/onboarding/recovery-key')} colors={colors} chevron />
          <Divider colors={colors} />
          <Row icon="refresh-outline" iconColor="#F5A623" label="Generate New Recovery Key" onPress={() => router.push('/onboarding/recovery-key')} colors={colors} chevron />
        </Section>

        {/* Backup */}
        <Section title="BACKUP">
          <Row icon="cloud-outline" iconColor="#4CAF87" label="iCloud Backup" description="Encrypted · Premium" value="Upgrade" onPress={() => router.push('/subscription')} colors={colors} premium />
        </Section>

        {/* Subscription */}
        <Section title="SUBSCRIPTION">
          <Row icon="star-outline" iconColor="#C4975A" label="Current Plan" value={settings.isPremium ? 'Premium' : 'Free'} colors={colors} />
          {!settings.isPremium && <>
            <Divider colors={colors} />
            <Row icon="arrow-up-circle-outline" iconColor="#C4975A" label="Upgrade to Premium" onPress={() => router.push('/subscription')} colors={colors} chevron />
          </>}
          <Divider colors={colors} />
          <Row icon="refresh-circle-outline" iconColor={colors.mutedForeground} label="Restore Purchases" onPress={() => Alert.alert('Restore', 'No previous purchases found.')} colors={colors} />
        </Section>

        {/* App */}
        <Section title="APP">
          <Row icon="apps-outline" iconColor="#5E9EFA" label="App Icon" description="Premium" value="Default" onPress={() => router.push('/subscription')} colors={colors} premium />
          <Divider colors={colors} />
          <Row icon="document-text-outline" iconColor={colors.mutedForeground} label="Privacy Policy" colors={colors} chevron />
          <Divider colors={colors} />
          <Row icon="reader-outline" iconColor={colors.mutedForeground} label="Terms of Use" colors={colors} chevron />
          <Divider colors={colors} />
          <Row icon="information-circle-outline" iconColor={colors.mutedForeground} label="Version" value="1.0.0" colors={colors} />
        </Section>

        {/* Danger */}
        <Section title="DANGER ZONE">
          <Row icon="lock-closed-outline" iconColor={colors.mutedForeground} label="Lock Vault" onPress={lock} colors={colors} />
          <Divider colors={colors} />
          <Row icon="trash-outline" iconColor={colors.destructive} label="Reset Vault" description="Delete all data permanently" onPress={handleResetVault} colors={colors} danger />
        </Section>

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          Vaultora · All data stays on your device{'\n'}The developer cannot access your files
        </Text>
      </ScrollView>

      {/* Change PIN Modal */}
      <ChangePinModal
        visible={showChangePinModal}
        onClose={() => { setShowChangePinModal(false); setChangePinStep('old'); setNewPinTemp(''); setPinError(false); }}
        colors={colors}
      />
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Row({ icon, iconColor, label, description, value, onPress, toggle, onToggle, colors, chevron, danger, premium }: {
  icon: string; iconColor: string; label: string; description?: string; value?: string;
  onPress?: () => void; toggle?: boolean; onToggle?: (v: boolean) => void;
  colors: any; chevron?: boolean; danger?: boolean; premium?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && toggle === undefined}
      style={({ pressed }) => [styles.row, { opacity: pressed && onPress ? 0.7 : 1 }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: `${iconColor}22` }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: danger ? colors.destructive : colors.foreground }]}>{label}</Text>
        {description && <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>{description}</Text>}
      </View>
      {toggle !== undefined ? (
        <Switch value={toggle} onValueChange={onToggle} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFF" />
      ) : premium ? (
        <View style={[styles.premiumBadge, { backgroundColor: 'rgba(196,151,90,0.15)' }]}>
          <Text style={[styles.premiumBadgeText, { color: '#C4975A' }]}>PRO</Text>
        </View>
      ) : value ? (
        <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>
      ) : chevron ? (
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      ) : null}
    </Pressable>
  );
}

function Divider({ colors }: { colors: any }) {
  return <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: 62 }]} />;
}

function ChangePinModal({ visible, onClose, colors }: { visible: boolean; onClose: () => void; colors: any }) {
  const { verifyPin, createPin } = useVault();
  const [step, setStep] = useState<'old' | 'new' | 'confirm'>('old');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState(false);

  const reset = () => { setStep('old'); setNewPin(''); setError(false); onClose(); };

  const handleOldPin = async (pin: string) => {
    const valid = await verifyPin(pin);
    if (valid) { setStep('new'); setError(false); }
    else setError(true);
  };

  const handleNewPin = (pin: string) => { setNewPin(pin); setStep('confirm'); };

  const handleConfirm = async (pin: string) => {
    if (pin !== newPin) { setError(true); return; }
    await createPin(pin);
    Alert.alert('Success', 'Your PIN has been changed.');
    reset();
  };

  const titles = { old: 'Enter Current PIN', new: 'Enter New PIN', confirm: 'Confirm New PIN' };
  const handlers = { old: handleOldPin, new: handleNewPin, confirm: handleConfirm };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={reset}>
        <Pressable style={[styles.modalCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>{titles[step]}</Text>
          <PinPad
            onComplete={handlers[step]}
            error={error}
            onErrorReset={() => setError(false)}
            subtitle={error ? (step === 'old' ? 'Wrong PIN' : 'PINs do not match') : undefined}
          />
          <Pressable onPress={reset} style={styles.modalCancel}>
            <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  scroll: { paddingHorizontal: 16, paddingBottom: 120, gap: 6 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, paddingHorizontal: 4, paddingTop: 8 },
  sectionCard: { borderRadius: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  rowDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  rowValue: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  divider: { height: StyleSheet.hairlineWidth },
  premiumBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  premiumBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  footer: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18, paddingVertical: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 24 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  modalCancel: { alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
});
