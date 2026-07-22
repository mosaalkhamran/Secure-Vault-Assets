import React, { useState } from 'react';
import {
  Alert, Pressable, ScrollView, StyleSheet, Text,
  TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useVault } from '@/contexts/VaultContext';

// ─── Security questions list ──────────────────────────────────────────────────
export const SECURITY_QUESTIONS = [
  'ما اسم حيوانك الأليف الأول؟',
  'في أي مدينة وُلدت؟',
  'ما اسم مدرستك الابتدائية؟',
  'ما اسم أفضل صديق لك في طفولتك؟',
  'ما لقب فريقك الرياضي المفضل؟',
  'ما اسم الشارع الذي كبرت فيه؟',
  'ما اسم والدتك قبل الزواج؟',
  'ما طراز أول سيارة امتلكتها؟',
];

type Mode = 'choose' | 'phrase' | 'questions';
type QStep = 'q1' | 'q2' | 'done';

export default function RecoverySetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completeSetup, unlock, setupRecoveryPhrase, setupSecurityQuestions } = useVault();

  const [mode, setMode] = useState<Mode>('choose');

  // Phrase state
  const [phrase, setPhrase] = useState('');
  const [phraseConfirm, setPhraseConfirm] = useState('');
  const [phraseError, setPhraseError] = useState('');

  // Questions state
  const [qStep, setQStep] = useState<QStep>('q1');
  const [q1Idx, setQ1Idx] = useState(0);
  const [q2Idx, setQ2Idx] = useState(1);
  const [a1, setA1] = useState('');
  const [a2, setA2] = useState('');
  const [showQ1Picker, setShowQ1Picker] = useState(false);
  const [showQ2Picker, setShowQ2Picker] = useState(false);

  const finish = async () => {
    await completeSetup();
    unlock();
    router.replace('/');
  };

  // ── Phrase handlers ───────────────────────────────────────────────────────
  const handleSavePhrase = async () => {
    if (phrase.trim().length < 8) {
      setPhraseError('يجب أن تكون الجملة 8 أحرف على الأقل');
      return;
    }
    if (phrase.trim().toLowerCase() !== phraseConfirm.trim().toLowerCase()) {
      setPhraseError('الجملتان غير متطابقتان');
      return;
    }
    setPhraseError('');
    await setupRecoveryPhrase(phrase.trim());
    Alert.alert('تم الحفظ ✓', 'تم تخزين جملة الاسترجاع بأمان.', [
      { text: 'افتح الخزنة', onPress: finish },
    ]);
  };

  // ── Questions handlers ────────────────────────────────────────────────────
  const handleSaveAnswers = async () => {
    if (a1.trim().length < 2 || a2.trim().length < 2) {
      Alert.alert('تنبيه', 'يرجى الإجابة على كلا السؤالين');
      return;
    }
    if (q1Idx === q2Idx) {
      Alert.alert('تنبيه', 'اختر سؤالين مختلفين');
      return;
    }
    await setupSecurityQuestions([a1.trim(), a2.trim()]);
    Alert.alert('تم الحفظ ✓', 'تم تخزين إجاباتك بأمان.', [
      { text: 'افتح الخزنة', onPress: finish },
    ]);
  };

  // ── Choose screen ─────────────────────────────────────────────────────────
  if (mode === 'choose') {
    return (
      <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
          <View style={styles.progress}>
            {[1, 2, 3].map(i => (
              <View key={i} style={[styles.dot, { backgroundColor: i <= 3 ? colors.primary : colors.border }]} />
            ))}
          </View>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
          <View style={styles.titleSection}>
            <View style={[styles.iconBg, { backgroundColor: 'rgba(196,151,90,0.15)' }]}>
              <Ionicons name="shield-half-outline" size={32} color="#C4975A" />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>طريقة الاسترجاع</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              إذا نسيت رقم سرك أو أُعطل Face ID، كيف تريد استرجاع خزنتك؟
            </Text>
          </View>

          <View style={styles.options}>
            {/* Phrase */}
            <Pressable
              onPress={() => setMode('phrase')}
              style={({ pressed }) => [styles.optCard, { backgroundColor: colors.card, borderColor: 'rgba(196,151,90,0.4)', opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={[styles.optIcon, { backgroundColor: 'rgba(196,151,90,0.15)' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color="#C4975A" />
              </View>
              <View style={styles.optBody}>
                <Text style={[styles.optTitle, { color: colors.foreground }]}>جملة سرية</Text>
                <Text style={[styles.optDesc, { color: colors.mutedForeground }]}>
                  أي جملة تحفظها — مثل: "أول سيارتي كانت تويوتا 2008"
                </Text>
                <View style={[styles.badge, { backgroundColor: 'rgba(196,151,90,0.15)' }]}>
                  <Text style={[styles.badgeText, { color: '#C4975A' }]}>موصى به</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </Pressable>

            {/* Questions */}
            <Pressable
              onPress={() => setMode('questions')}
              style={({ pressed }) => [styles.optCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={[styles.optIcon, { backgroundColor: 'rgba(94,158,250,0.12)' }]}>
                <Ionicons name="help-circle-outline" size={24} color="#5E9EFA" />
              </View>
              <View style={styles.optBody}>
                <Text style={[styles.optTitle, { color: colors.foreground }]}>أسئلة أمان</Text>
                <Text style={[styles.optDesc, { color: colors.mutedForeground }]}>
                  اختر سؤالين وأجب عليهما — مألوف وسهل
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </Pressable>

            {/* iCloud note */}
            <View style={[styles.icloudCard, { backgroundColor: 'rgba(94,158,250,0.07)', borderColor: 'rgba(94,158,250,0.2)' }]}>
              <Ionicons name="cloud-outline" size={18} color="#5E9EFA" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.icloudTitle, { color: '#5E9EFA' }]}>iCloud Keychain — تلقائي دائماً</Text>
                <Text style={[styles.icloudDesc, { color: colors.mutedForeground }]}>
                  عند تغيير جوالك وتسجيل نفس Apple ID، ستجد خزنتك جاهزة بدون أي خطوة إضافية.
                </Text>
              </View>
            </View>

            {/* Skip */}
            <Pressable onPress={finish} style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>تخطي — سأعتمد على Face ID فقط</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Phrase screen ─────────────────────────────────────────────────────────
  if (mode === 'phrase') {
    return (
      <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable onPress={() => setMode('choose')} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>جملة سرية</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
          <View style={styles.titleSection}>
            <View style={[styles.iconBg, { backgroundColor: 'rgba(196,151,90,0.15)' }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={28} color="#C4975A" />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>اكتب جملة لا تنساها</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              أي جملة تعرفها — لا تحتاج لحفظها في مكان آخر
            </Text>
          </View>

          {/* Examples */}
          <View style={[styles.exCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.exLabel, { color: colors.mutedForeground }]}>أمثلة:</Text>
            {[
              'ولدت في الرياض سنة 1990',
              'اسم كلبي ماكس وهو بني اللون',
              'درست في جامعة الملك عبدالله',
            ].map((ex, i) => (
              <View key={i} style={styles.exRow}>
                <Ionicons name="ellipse" size={5} color={colors.mutedForeground} />
                <Text style={[styles.exText, { color: colors.mutedForeground }]}>{ex}</Text>
              </View>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>الجملة السرية</Text>
            <TextInput
              value={phrase}
              onChangeText={v => { setPhrase(v); setPhraseError(''); }}
              placeholder="اكتب جملتك هنا..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              autoCapitalize="sentences"
              style={[styles.phraseInput, {
                color: colors.foreground,
                borderColor: phraseError ? colors.destructive : colors.border,
                backgroundColor: colors.input,
              }]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>تأكيد الجملة</Text>
            <TextInput
              value={phraseConfirm}
              onChangeText={v => { setPhraseConfirm(v); setPhraseError(''); }}
              placeholder="أعد كتابة الجملة..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              autoCapitalize="sentences"
              style={[styles.phraseInput, {
                color: colors.foreground,
                borderColor: phraseError ? colors.destructive : colors.border,
                backgroundColor: colors.input,
              }]}
            />
          </View>

          {phraseError ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>{phraseError}</Text>
          ) : null}

          <Pressable
            onPress={handleSavePhrase}
            disabled={phrase.trim().length < 8}
            style={({ pressed }) => [styles.saveBtn, {
              backgroundColor: phrase.trim().length >= 8 ? '#C4975A' : colors.accent,
              opacity: pressed ? 0.85 : 1,
            }]}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color={phrase.trim().length >= 8 ? '#0A0A12' : colors.mutedForeground} />
            <Text style={[styles.saveBtnText, { color: phrase.trim().length >= 8 ? '#0A0A12' : colors.mutedForeground }]}>
              احفظ وافتح الخزنة
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── Questions screen ──────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: '#0A0A12' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => setMode('choose')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>أسئلة الأمان</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <Text style={[styles.qaNote, { color: colors.mutedForeground }]}>
          اختر سؤالين وأجب عليهما. ستحتاج الإجابة الدقيقة عند الاسترجاع.
        </Text>

        {/* Question 1 */}
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
                <Pressable
                  key={i}
                  onPress={() => { setQ1Idx(i); setShowQ1Picker(false); setA1(''); }}
                  style={[styles.qOption, i === q1Idx && { backgroundColor: 'rgba(196,151,90,0.12)' }]}
                >
                  <Text style={[styles.qOptionText, { color: i === q1Idx ? '#C4975A' : colors.foreground }]}>{q}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <TextInput
            value={a1}
            onChangeText={setA1}
            placeholder="إجابتك..."
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.answerInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
          />
        </View>

        {/* Question 2 */}
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
                <Pressable
                  key={i}
                  onPress={() => { setQ2Idx(i); setShowQ2Picker(false); setA2(''); }}
                  style={[styles.qOption, i === q2Idx && { backgroundColor: 'rgba(196,151,90,0.12)' }]}
                >
                  <Text style={[styles.qOptionText, { color: i === q2Idx ? '#C4975A' : colors.foreground }]}>{q}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <TextInput
            value={a2}
            onChangeText={setA2}
            placeholder="إجابتك..."
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.answerInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
          />
        </View>

        <Pressable
          onPress={handleSaveAnswers}
          disabled={a1.trim().length < 2 || a2.trim().length < 2}
          style={({ pressed }) => [styles.saveBtn, {
            backgroundColor: (a1.trim().length >= 2 && a2.trim().length >= 2) ? '#5E9EFA' : colors.accent,
            opacity: pressed ? 0.85 : 1,
          }]}
        >
          <Ionicons name="shield-checkmark-outline" size={18}
            color={(a1.trim().length >= 2 && a2.trim().length >= 2) ? '#fff' : colors.mutedForeground} />
          <Text style={[styles.saveBtnText, {
            color: (a1.trim().length >= 2 && a2.trim().length >= 2) ? '#fff' : colors.mutedForeground,
          }]}>
            احفظ وافتح الخزنة
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progress: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  content: { paddingHorizontal: 24, gap: 20, paddingTop: 8 },
  titleSection: { alignItems: 'center', gap: 12 },
  iconBg: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  options: { gap: 14 },
  optCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 18, borderWidth: 1,
  },
  optIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optBody: { flex: 1, gap: 4 },
  optTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  optDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  icloudCard: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  icloudTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  icloudDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  skipText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  // Phrase
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  phraseInput: {
    minHeight: 80, borderRadius: 14, borderWidth: 1, padding: 14,
    fontFamily: 'Inter_400Regular', fontSize: 15, textAlignVertical: 'top',
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  exCard: { borderRadius: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth, gap: 8 },
  exLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exText: { fontSize: 13, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
  saveBtn: {
    height: 54, borderRadius: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  // Questions
  qaNote: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22, textAlign: 'center' },
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
});
