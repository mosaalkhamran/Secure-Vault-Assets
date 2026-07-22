import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Switch, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/contexts/VaultContext';
import PinPad from '@/components/PinPad';
import { SUPPORTED_LANGUAGES, changeLanguage } from '@/services/i18n';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const {
    settings, vaultItems, trashedItems, lock, resetVault,
    updateSettings, enableFaceId, disableFaceId, isFaceIdAvailable,
    createPin, hasDecoyPin, setupDecoyPin, removeDecoyPin,
    isSyncing, lastSyncAt, enableiCloudSync, disableiCloudSync, syncToCloud,
  } = useVault();

  const [showChangePinModal, setShowChangePinModal] = useState(false);

  const handleSyncToggle = async (enabled: boolean) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (enabled) {
      const ok = await enableiCloudSync();
      if (!ok) Alert.alert(t('settings.backup.unavailable'), t('settings.backup.unavailableMsg'));
    } else {
      await disableiCloudSync();
    }
  };

  const handleSyncNow = async () => {
    if (isSyncing) return;
    await syncToCloud();
    Alert.alert(t('settings.backup.syncSuccess'), t('settings.backup.syncSuccessMsg'));
  };

  const formatSyncTime = (iso: string | null) => {
    if (!iso) return t('settings.backup.lastSyncNever');
    const d = new Date(iso);
    return d.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : undefined, {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const handleLanguageChange = () => {
    const options = SUPPORTED_LANGUAGES.map(lang => ({
      text: `${lang.flag} ${lang.label}${i18n.language === lang.code ? ' ✓' : ''}`,
      onPress: async () => {
        const { needsRestart } = await changeLanguage(lang.code);
        if (needsRestart) {
          Alert.alert(t('settings.language.restart'), t('settings.language.restartMsg'));
        }
      },
    }));
    Alert.alert(
      t('settings.language.changeTitle'),
      undefined,
      [...options, { text: t('common.cancel'), style: 'cancel' as const, onPress: async () => {} }],
    );
  };

  const totalBytes = vaultItems.reduce((s, i) => s + i.size, 0);
  const formatSize = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const AUTO_LOCK_OPTIONS = [
    { label: t('settings.security.immediately'), value: 0 },
    { label: t('settings.security.sec15'), value: 15 },
    { label: t('settings.security.sec30'), value: 30 },
    { label: t('settings.security.min1'), value: 60 },
    { label: t('settings.security.min5'), value: 300 },
    { label: t('settings.security.never'), value: -1 },
  ];

  const handleAutoLock = () => {
    Alert.alert(
      t('settings.security.autoLockTitle'),
      t('settings.security.autoLockAfter'),
      AUTO_LOCK_OPTIONS.map(o => ({
        text: o.label + (settings.autoLockSeconds === o.value ? ' ✓' : ''),
        onPress: async () => { await updateSettings({ autoLockSeconds: o.value }); },
      })).concat([{ text: t('common.cancel'), onPress: async () => {} }]),
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
    Alert.alert(t('settings.danger.resetTitle'), t('settings.danger.resetMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.danger.reset'), style: 'destructive',
        onPress: () =>
          Alert.alert(t('settings.danger.resetFinalTitle'), t('settings.danger.resetFinalMsg'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('settings.danger.deleteAll'), style: 'destructive', onPress: () => resetVault() },
          ]),
      },
    ]);
  };

  const autoLockLabel = AUTO_LOCK_OPTIONS.find(o => o.value === settings.autoLockSeconds)?.label
    ?? t('settings.security.min5');

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language);

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
        <Text style={[styles.title, { color: colors.foreground }]}>{t('settings.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Vault Stats */}
        <Section title={t('settings.vault.title')}>
          <Row icon="images-outline" iconColor={colors.primary} label={t('settings.vault.photos')} value={String(vaultItems.filter(i => i.type === 'photo').length)} colors={colors} />
          <Divider colors={colors} />
          <Row icon="videocam-outline" iconColor={colors.primary} label={t('settings.vault.videos')} value={String(vaultItems.filter(i => i.type === 'video').length)} colors={colors} />
          <Divider colors={colors} />
          <Row icon="server-outline" iconColor={colors.primary} label={t('settings.vault.storage')} value={formatSize(totalBytes)} colors={colors} />
          {trashedItems.length > 0 && <><Divider colors={colors} />
          <Row icon="trash-outline" iconColor={colors.destructive} label={t('settings.vault.deletedItems')} value={String(trashedItems.length)} onPress={() => router.push('/trash')} colors={colors} /></>}
        </Section>

        {/* Security */}
        <Section title={t('settings.security.title')}>
          <Row icon="keypad-outline" iconColor="#5E9EFA" label={t('settings.security.changePin')} onPress={() => setShowChangePinModal(true)} colors={colors} chevron />
          <Divider colors={colors} />
          {isFaceIdAvailable && <>
            <Row
              icon="scan-outline" iconColor="#5E9EFA" label={t('settings.security.faceId')}
              toggle={settings.faceIdEnabled}
              onToggle={handleFaceIdToggle}
              colors={colors}
            />
            <Divider colors={colors} />
          </>}
          <Row icon="timer-outline" iconColor="#5E9EFA" label={t('settings.security.autoLock')} value={autoLockLabel} onPress={handleAutoLock} colors={colors} chevron />
        </Section>

        {/* Privacy */}
        <Section title={t('settings.privacy.title')}>
          <Row
            icon="eye-off-outline" iconColor="#9B59B6"
            label={t('settings.privacy.cover')}
            description={t('settings.privacy.coverDesc')}
            toggle={settings.privacyCoverEnabled}
            onToggle={v => updateSettings({ privacyCoverEnabled: v })}
            colors={colors}
            premium={!settings.isPremium}
          />
          {settings.privacyCoverEnabled && <>
            <Divider colors={colors} />
            <Row
              icon="calculator-outline" iconColor="#9B59B6"
              label={t('settings.privacy.coverType')} value="Calculator"
              onPress={() => router.push('/privacy-cover/calculator')}
              colors={colors} chevron
            />
            <Divider colors={colors} />
            <Row
              icon="eye-outline" iconColor="#9B59B6"
              label={t('settings.privacy.previewCover')}
              onPress={() => router.push('/privacy-cover/calculator')}
              colors={colors} chevron
            />
          </>}
        </Section>

        {/* Recovery */}
        <Section title={t('settings.recovery.title')}>
          <Row
            icon="chatbubble-ellipses-outline" iconColor="#F5A623"
            label={t('settings.recovery.methods')}
            description={t('settings.recovery.methodsDesc')}
            onPress={() => router.push('/onboarding/recovery')}
            colors={colors} chevron
          />
        </Section>

        {/* iCloud Backup */}
        <Section title={t('settings.backup.title')}>
          <Row
            icon="cloud-outline" iconColor="#5E9EFA"
            label={t('settings.backup.icloud')}
            description={settings.iCloudSyncEnabled
              ? t('settings.backup.lastSync', { time: formatSyncTime(lastSyncAt) })
              : t('settings.backup.icloudDesc')}
            toggle={settings.iCloudSyncEnabled}
            onToggle={handleSyncToggle}
            colors={colors}
          />
          {settings.iCloudSyncEnabled && (
            <>
              <Divider colors={colors} />
              <Row
                icon={isSyncing ? 'sync-outline' : 'refresh-outline'}
                iconColor="#5E9EFA"
                label={isSyncing ? t('settings.backup.syncing') : t('settings.backup.syncNow')}
                onPress={handleSyncNow}
                colors={colors}
                chevron={!isSyncing}
              />
            </>
          )}
        </Section>

        {/* Language */}
        <Section title={t('settings.language.title')}>
          <Row
            icon="language-outline" iconColor="#5E9EFA"
            label={t('settings.language.label')}
            value={currentLang ? `${currentLang.flag} ${currentLang.label}` : i18n.language.toUpperCase()}
            onPress={handleLanguageChange}
            colors={colors} chevron
          />
        </Section>

        {/* Subscription */}
        <Section title={t('settings.subscription.title')}>
          <Row icon="star-outline" iconColor="#C4975A" label={t('settings.subscription.currentPlan')} value={settings.isPremium ? t('settings.subscription.premium') : t('settings.subscription.free')} colors={colors} />
          {!settings.isPremium && <>
            <Divider colors={colors} />
            <Row icon="arrow-up-circle-outline" iconColor="#C4975A" label={t('settings.subscription.upgrade')} onPress={() => router.push('/subscription')} colors={colors} chevron />
          </>}
          <Divider colors={colors} />
          <Row icon="refresh-circle-outline" iconColor={colors.mutedForeground} label={t('settings.subscription.restore')} onPress={() => Alert.alert('Restore', 'No previous purchases found.')} colors={colors} />
        </Section>

        {/* App */}
        <Section title={t('settings.app.title')}>
          <Row icon="apps-outline" iconColor="#5E9EFA" label={t('settings.app.icon')} description="Premium" value="Default" onPress={() => router.push('/subscription')} colors={colors} premium />
          <Divider colors={colors} />
          <Row icon="document-text-outline" iconColor={colors.mutedForeground} label={t('settings.app.privacy')} onPress={() => router.push('/legal/privacy-policy')} colors={colors} chevron />
          <Divider colors={colors} />
          <Row icon="reader-outline" iconColor={colors.mutedForeground} label={t('settings.app.terms')} onPress={() => router.push('/legal/terms')} colors={colors} chevron />
          <Divider colors={colors} />
          <Row icon="information-circle-outline" iconColor={colors.mutedForeground} label={t('settings.app.about')} onPress={() => router.push('/legal/about')} colors={colors} chevron />
        </Section>

        {/* Decoy Vault */}
        <Section title={t('settings.decoy.title')}>
          <Row
            icon="glasses-outline" iconColor="#9B59B6"
            label={t('settings.decoy.title')}
            description={hasDecoyPin ? t('settings.decoy.activeDesc') : t('settings.decoy.desc')}
            onPress={() => {
              if (hasDecoyPin) {
                Alert.alert(t('settings.decoy.title'), t('settings.decoy.activeDesc'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('settings.decoy.remove'), style: 'destructive', onPress: () => removeDecoyPin() },
                ]);
              } else {
                router.push('/setup-decoy-pin');
              }
            }}
            colors={colors}
            premium={!settings.isPremium}
            chevron={settings.isPremium || hasDecoyPin}
          />
        </Section>

        {/* Danger */}
        <Section title={t('settings.danger.title')}>
          <Row icon="lock-closed-outline" iconColor={colors.mutedForeground} label={t('settings.danger.lock')} onPress={lock} colors={colors} />
          <Divider colors={colors} />
          <Row icon="trash-outline" iconColor={colors.destructive} label={t('settings.danger.reset')} description={t('settings.danger.resetDesc')} onPress={handleResetVault} colors={colors} danger />
        </Section>

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          {t('settings.footer')}
        </Text>
      </ScrollView>

      {/* Change PIN Modal */}
      <ChangePinModal
        visible={showChangePinModal}
        onClose={() => setShowChangePinModal(false)}
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
  const { t } = useTranslation();
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
    Alert.alert(t('common.success'), 'Your PIN has been changed.');
    reset();
  };

  const titles = {
    old: 'Enter Current PIN',
    new: 'Enter New PIN',
    confirm: t('onboarding.confirmPin.title'),
  };
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
            subtitle={error ? (step === 'old' ? 'Wrong PIN' : t('onboarding.confirmPin.error')) : undefined}
          />
          <Pressable onPress={reset} style={styles.modalCancel}>
            <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>{t('common.cancel')}</Text>
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
