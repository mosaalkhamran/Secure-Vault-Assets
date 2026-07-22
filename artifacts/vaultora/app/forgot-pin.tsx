import React, { useState } from 'react';
import {
  Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/contexts/VaultContext';
import PinPad from '@/components/PinPad';
import { SECURITY_QUESTIONS } from '@/app/onboarding/recovery';

type Step =
  | 'options'
  | 'face-id'
  | 'phrase'
  | 'questions'
  | 'new-pin'
  | 'confirm-new-pin';

export default function ForgotPinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    createPin, unlock,
    settings, isFaceIdAvailable, authenticateWithFaceId,
    hasRecoveryPhrase, verifyRecoveryPhrase,
    hasSecurityQuestions, verifySecurityAnswers,
  } = useVault();

  const [step, setStep] = useState<Step>('options');
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Phrase
  const [phraseInput, setPhraseInput] = useState('');

  // Questions — store which questions were set during onboarding
  // (we don't know which indices were picked, so we ask them to pick again)
  const [q1Idx, setQ1Idx] = useState(0);
  const [q2Idx, setQ2Idx] = useState(1);
  const [a1, setA1] = useState('');
  const [a2, setA2] = useState('');
  const [showQ1Picker, setShowQ1Picker] = useState(false);
  const [showQ2Picker, setShowQ2Picker] = useState(false);
  const [qError, setQError] = useState('');

  // ── Face ID ─────────────────────────────────────────────────────────────
  const handleFaceId = async () => {
    const success = await authenticateWithFaceId();
    if (success) setStep('new-pin');
    else Alert.alert('تعذّر التحقق', 'لم يتعرف Face ID على وجهك. حاول مرة أخرى أو استخدم طريقة أخرى.');
  };

  // ── Recovery phrase ──────────────────────────────────────────────────────
  const handleVerifyPhrase = async () => {
    const ok = await verifyRecoveryPhrase(phraseInput);
    if (ok) setStep('new-pin');
    else Alert.alert('جملة غير صحيحة', 'الجملة التي أدخلتها غير متطابقة. تأكد من الكتابة وحاول مجدداً.');
  };

  // ── Security questions ───────────────────────────────────────────────────
  const handleVerifyAnswers = async () => {
    setQError('');
    const ok = await verifySecurityAnswers([a1.trim(), a2.trim()]);
    if (ok) setStep('new-pin');
    else setQError('الإجابات غير صحيحة — تأكد من نفس الإجابات التي أدخلتها عند الإعداد');
  };

  // ── New PIN ──────────────────────────────────────────────────────────────
  const handleNewPin = (pin: string) => { setNewPin(pin); setStep('confirm-new-pin'); };

  const handleConfirmPin = async (pin: string) => {
    if (pin !== newPin) { setPinError(true); return; }
    await createPin(pin);
    unlock();
    router.replace('/');
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const goBack = () => {
    if (step === 'options') router.back();
    else if (['phrase', 'questions', 'face-id'].includes(step)) setStep('options');
    else setStep('options');
  };

  const headerTitle: Record<Step, string> = {
    options: 'نسيت الرقم السري',
    'face-id': 'Face ID',
    phrase: 'الجملة السرية',
    questions: 'أسئلة الأمان',
    'new-pin': 'رقم سري جديد',
    'confirm-new-pin': 'تأكيد الرقم السري',
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{headerTitle[step]}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ──────── OPTIONS ──────── */}
        {step === 'options' && (
          <>
            <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                اختر إحدى طرق الاسترجاع المتاحة لإعادة تعيين رقمك السري.
              </Text>
            </View>

            <View style={styles.options}>
              {/* Face ID */}
              {settings.faceIdEnabled && isFaceIdAvailable && (
                <OptionCard
                  icon="scan-outline" iconColor="#5E9EFA"
                  title="Face ID"
                  desc="التحقق بوجهك لإعادة تعيين الرقم السري"
                  onPress={handleFaceId} colors={colors}
                />
              )}

              {/* Recovery phrase */}
              {hasRecoveryPhrase && (
                <OptionCard
                  icon="chatbubble-ellipses-outline" iconColor="#C4975A"
                  title="الجملة السرية"
                  desc="أدخل الجملة التي حددتها عند الإعداد"
                  onPress={() => setStep('phrase')} colors={colors}
                />
              )}

              {/* Security questions */}
              {hasSecurityQuestions && (
                <OptionCard
                  icon="help-circle-outline" iconColor="#4CAF87"
                  title="أسئلة الأمان"
                  desc="أجب على السؤالين اللذين اخترتهما عند الإعداد"
                  onPress={() => setStep('questions')} colors={colors}
                />
              )}

              {/* iCloud info */}
              <View style={[styles.icloudCard, { backgroundColor: 'rgba(94,158,250,0.07)', borderColor: 'rgba(94,158,250,0.2)' }]}>
                <Ionicons name="cloud-outline" size={20} color="#5E9EFA" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.icloudTitle, { color: '#5E9EFA' }]}>تغيير الجوال؟</Text>
                  <Text style={[styles.icloudDesc, { color: colors.mutedForeground }]}>
                    إذا سجّلت نفس Apple ID على جهازك الجديد، تجد خزنتك جاهزة تلقائياً عبر iCloud Keychain.
                  </Text>
                </View>
              </View>

              {/* Wipe — last resort */}
              <View style={[styles.dangerZone, { borderColor: 'rgba(224,85,85,0.3)' }]}>
                <Text style={[styles.dangerLabel, { color: colors.destructive }]}>الملاذ الأخير</Text>
                <OptionCard
                  icon="trash-outline" iconColor={colors.destructive}
                  title="مسح الخزنة والبدء من جديد"
                  desc="سيُحذف كل شيء نهائياً — لا يمكن التراجع"
                  onPress={() => Alert.alert(
                    'مسح الخزنة',
                    'سيتم حذف جميع صورك وفيديوهاتك بشكل نهائي لا يمكن التراجع عنه. هل أنت متأكد؟',
                    [
                      { text: 'إلغاء', style: 'cancel' },
                      { text: 'احذف كل شيء', style: 'destructive', onPress: () => router.replace('/onboarding') },
                    ]
                  )}
                  colors={colors} danger
                />
              </View>
            </View>
          </>
        )}

        {/* ──────── PHRASE ──────── */}
        {step === 'phrase' && (
          <View style={styles.recoverySection}>
            <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
              أدخل نفس الجملة التي كتبتها عند إعداد الخزنة. غير حساسة لحالة الأحرف.
            </Text>
            <TextInput
              value={phraseInput}
              onChangeText={setPhraseInput}
              placeholder="جملتك السرية..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              autoCapitalize="sentences"
              style={[styles.phraseInput, {
                color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input,
              }]}
            />
            <Pressable
              onPress={handleVerifyPhrase}
              disabled={phraseInput.trim().length < 4}
              style={[styles.actionBtn, {
                backgroundColor: phraseInput.trim().length >= 4 ? '#C4975A' : colors.accent,
              }]}
            >
              <Text style={[styles.actionBtnText, {
                color: phraseInput.trim().length >= 4 ? '#0A0A12' : colors.mutedForeground,
              }]}>تحقق من الجملة</Text>
            </Pressable>
          </View>
        )}

        {/* ──────── QUESTIONS ──────── */}
        {step === 'questions' && (
          <View style={styles.recoverySection}>
            <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
              اختر نفس السؤالين اللذين أجبت عليهما عند الإعداد، وأدخل نفس الإجابات.
            </Text>

            {/* Q1 */}
            <View style={styles.qaBlock}>
              <Text style={[styles.qaLabel, { color: colors.foreground }]}>السؤال الأول</Text>
              <Pressable
                onPress={() => { setShowQ1Picker(!showQ1Picker); setShowQ2Picker(false); }}
                style={[styles.qPicker, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.qPickerText, { color: colors.foreground }]} numberOfLines={1}>
                  {SECURITY_QUESTIONS[q1Idx]}
                </Text>
                <Ionicons name={showQ1Picker ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
              </Pressable>
              {showQ1Picker && (
                <View style={[styles.qDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {SECURITY_QUESTIONS.map((q, i) => (
                    <Pressable key={i} onPress={() => { setQ1Idx(i); setShowQ1Picker(false); setA1(''); }}
                      style={[styles.qOption, i === q1Idx && { backgroundColor: 'rgba(196,151,90,0.12)' }]}>
                      <Text style={[styles.qOptionText, { color: i === q1Idx ? '#C4975A' : colors.foreground }]}>{q}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              <TextInput value={a1} onChangeText={v => { setA1(v); setQError(''); }}
                placeholder="إجابتك..." placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none" autoCorrect={false}
                style={[styles.answerInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
              />
            </View>

            {/* Q2 */}
            <View style={styles.qaBlock}>
              <Text style={[styles.qaLabel, { color: colors.foreground }]}>السؤال الثاني</Text>
              <Pressable
                onPress={() => { setShowQ2Picker(!showQ2Picker); setShowQ1Picker(false); }}
                style={[styles.qPicker, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.qPickerText, { color: colors.foreground }]} numberOfLines={1}>
                  {SECURITY_QUESTIONS[q2Idx]}
                </Text>
                <Ionicons name={showQ2Picker ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
              </Pressable>
              {showQ2Picker && (
                <View style={[styles.qDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {SECURITY_QUESTIONS.map((q, i) => (
                    <Pressable key={i} onPress={() => { setQ2Idx(i); setShowQ2Picker(false); setA2(''); }}
                      style={[styles.qOption, i === q2Idx && { backgroundColor: 'rgba(196,151,90,0.12)' }]}>
                      <Text style={[styles.qOptionText, { color: i === q2Idx ? '#C4975A' : colors.foreground }]}>{q}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              <TextInput value={a2} onChangeText={v => { setA2(v); setQError(''); }}
                placeholder="إجابتك..." placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none" autoCorrect={false}
                style={[styles.answerInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
              />
            </View>

            {qError ? <Text style={[styles.errorText, { color: colors.destructive }]}>{qError}</Text> : null}

            <Pressable
              onPress={handleVerifyAnswers}
              disabled={a1.trim().length < 2 || a2.trim().length < 2}
              style={[styles.actionBtn, {
                backgroundColor: (a1.trim().length >= 2 && a2.trim().length >= 2) ? '#4CAF87' : colors.accent,
              }]}
            >
              <Text style={[styles.actionBtnText, {
                color: (a1.trim().length >= 2 && a2.trim().length >= 2) ? '#fff' : colors.mutedForeground,
              }]}>تحقق من الإجابات</Text>
            </Pressable>
          </View>
        )}

        {/* ──────── NEW PIN ──────── */}
        {step === 'new-pin' && (
          <View style={styles.pinSection}>
            <PinPad onComplete={handleNewPin} subtitle="أنشئ رقماً سرياً جديداً" />
          </View>
        )}

        {/* ──────── CONFIRM PIN ──────── */}
        {step === 'confirm-new-pin' && (
          <View style={styles.pinSection}>
            <PinPad
              onComplete={handleConfirmPin}
              error={pinError}
              onErrorReset={() => setPinError(false)}
              subtitle="أكد رقمك السري الجديد"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function OptionCard({ icon, iconColor, title, desc, onPress, colors, danger }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.optionCard, {
        backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1,
      }]}
    >
      <View style={[styles.optIcon, { backgroundColor: `${iconColor}22` }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.optText}>
        <Text style={[styles.optTitle, { color: danger ? colors.destructive : colors.foreground }]}>{title}</Text>
        <Text style={[styles.optDesc, { color: colors.mutedForeground }]}>{desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </Pressable>
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
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  options: { gap: 12 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
  },
  optIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optText: { flex: 1 },
  optTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  optDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  icloudCard: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  icloudTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  icloudDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  dangerZone: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 8 },
  dangerLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 4 },
  recoverySection: { gap: 16 },
  sectionNote: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  phraseInput: {
    minHeight: 90, borderRadius: 14, borderWidth: 1, padding: 14,
    fontFamily: 'Inter_400Regular', fontSize: 15, textAlignVertical: 'top',
  },
  actionBtn: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  pinSection: { paddingTop: 20 },
  // Questions
  qaBlock: { gap: 10 },
  qaLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  qPicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  qPickerText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  qDropdown: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  qOption: { padding: 12 },
  qOptionText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  answerInput: {
    height: 48, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, fontSize: 15, fontFamily: 'Inter_400Regular',
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
