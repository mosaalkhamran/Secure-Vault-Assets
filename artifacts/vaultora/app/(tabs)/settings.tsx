import React, { useState } from 'react';
import {
  Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/contexts/VaultContext';

type SettingsSection = {
  title: string;
  items: SettingsItem[];
};

type SettingsItem = {
  id: string;
  icon: string;
  iconColor?: string;
  label: string;
  description?: string;
  action?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  danger?: boolean;
  value?: string;
};

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, lock, resetVault, updateSettings, vaultItems, enableFaceId, disableFaceId, isFaceIdAvailable } = useVault();
  const [showChangePinModal, setShowChangePinModal] = useState(false);

  const totalSize = vaultItems.reduce((sum, i) => sum + i.size, 0);
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFaceIdToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await enableFaceId();
      if (!success) Alert.alert('Face ID', 'Could not enable Face ID. Please try again.');
    } else {
      await disableFaceId();
    }
  };

  const handleResetVault = () => {
    Alert.alert(
      'Reset Vault',
      'This will permanently delete all files in your vault and remove your PIN. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Vault',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'Type "RESET" to confirm. All files will be lost forever.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset Forever', style: 'destructive', onPress: () => resetVault() },
              ]
            );
          },
        },
      ]
    );
  };

  const sections: SettingsSection[] = [
    {
      title: 'Vault',
      items: [
        {
          id: 'stats',
          icon: 'bar-chart-outline',
          label: 'Storage Used',
          value: formatSize(totalSize),
          iconColor: colors.primary,
        },
        {
          id: 'items',
          icon: 'images-outline',
          label: 'Secured Items',
          value: `${vaultItems.length}`,
          iconColor: colors.primary,
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          id: 'change-pin',
          icon: 'keypad-outline',
          label: 'Change PIN',
          iconColor: '#5E9EFA',
          action: () => setShowChangePinModal(true),
        },
        ...(isFaceIdAvailable ? [{
          id: 'face-id',
          icon: 'scan-outline',
          label: 'Face ID',
          iconColor: '#5E9EFA',
          toggle: true as const,
          toggleValue: settings.faceIdEnabled,
          onToggle: handleFaceIdToggle,
        }] : []),
        {
          id: 'auto-lock',
          icon: 'timer-outline',
          label: 'Auto-lock',
          iconColor: '#5E9EFA',
          value: settings.autoLockMinutes === 0 ? 'Immediately' : `${settings.autoLockMinutes} min`,
          action: () => {
            const options = [0, 1, 5, 15, 30];
            Alert.alert('Auto-lock', 'Lock vault after:', options.map(m => ({
              text: m === 0 ? 'Immediately' : `${m} minute${m !== 1 ? 's' : ''}`,
              onPress: () => updateSettings({ autoLockMinutes: m }),
            })).concat([{ text: 'Cancel', onPress: () => {} } as any]));
          },
        },
      ],
    },
    {
      title: 'Recovery',
      items: [
        {
          id: 'recovery-key',
          icon: 'key-outline',
          label: 'Recovery Key',
          description: 'Regenerate your backup access key',
          iconColor: '#F5A623',
          action: () => router.push('/onboarding/recovery-key'),
        },
        {
          id: 'icloud-backup',
          icon: 'cloud-outline',
          label: 'iCloud Backup',
          description: 'Premium — encrypted backup to your iCloud',
          iconColor: '#4CAF87',
          value: 'Upgrade',
        },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        {
          id: 'lock',
          icon: 'lock-closed-outline',
          label: 'Lock Vault',
          iconColor: colors.mutedForeground,
          action: lock,
        },
        {
          id: 'reset',
          icon: 'trash-outline',
          label: 'Reset Vault',
          description: 'Delete all data permanently',
          iconColor: colors.destructive,
          action: handleResetVault,
          danger: true,
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {section.items.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <Pressable
                    onPress={item.action}
                    disabled={!item.action && !item.toggle}
                    style={({ pressed }) => [styles.row, { opacity: pressed && item.action ? 0.7 : 1 }]}
                  >
                    <View style={[styles.iconBg, { backgroundColor: `${item.iconColor ?? colors.primary}22` }]}>
                      <Ionicons name={item.icon as any} size={18} color={item.iconColor ?? colors.primary} />
                    </View>
                    <View style={styles.rowContent}>
                      <Text style={[styles.rowLabel, { color: item.danger ? colors.destructive : colors.foreground }]}>
                        {item.label}
                      </Text>
                      {item.description && (
                        <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
                      )}
                    </View>
                    {item.toggle ? (
                      <Switch
                        value={item.toggleValue}
                        onValueChange={item.onToggle}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#FFF"
                      />
                    ) : item.value ? (
                      <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{item.value}</Text>
                    ) : item.action ? (
                      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                    ) : null}
                  </Pressable>
                  {idx < section.items.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          Vaultora · All data encrypted on-device
        </Text>
      </ScrollView>

      <ChangePinModal
        visible={showChangePinModal}
        onClose={() => setShowChangePinModal(false)}
        colors={colors}
      />
    </View>
  );
}

function ChangePinModal({ visible, onClose, colors }: { visible: boolean; onClose: () => void; colors: any }) {
  const { changePin } = useVault();
  const [step, setStep] = useState<'old' | 'new' | 'confirm'>('old');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');

  const handleVerifyOld = async () => {
    const valid = await (useVault as any);
    // Simple PIN change flow through text input for modal
  };

  const reset = () => { setStep('old'); setOldPin(''); setNewPin(''); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={reset}>
        <Pressable style={[styles.modalCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Change PIN</Text>
          <Text style={[styles.modalDesc, { color: colors.mutedForeground }]}>
            Use the Forgot PIN option from the lock screen to reset your PIN securely.
          </Text>
          <Pressable onPress={reset} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
            <Text style={[styles.modalBtnText, { color: colors.primaryForeground }]}>Got it</Text>
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
  scroll: { paddingHorizontal: 16, paddingBottom: 120, gap: 8 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 12, fontFamily: 'Inter_500Medium', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 4, marginTop: 8 },
  sectionCard: { borderRadius: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  rowDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  rowValue: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 62 },
  version: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { margin: 16, borderRadius: 20, padding: 24, gap: 12, marginBottom: 32 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  modalDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  modalBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  modalBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
