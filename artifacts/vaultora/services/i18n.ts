import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import en from '@/locales/en';
import ar from '@/locales/ar';
import fr from '@/locales/fr';
import tr from '@/locales/tr';
import fa from '@/locales/fa';
import ur from '@/locales/ur';

// ─── Supported languages ──────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  { code: 'ar', label: 'العربية',  flag: '🇸🇦', rtl: true  },
  { code: 'en', label: 'English',  flag: '🇬🇧', rtl: false },
  { code: 'fr', label: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'tr', label: 'Türkçe',   flag: '🇹🇷', rtl: false },
  { code: 'fa', label: 'فارسی',    flag: '🇮🇷', rtl: true  },
  { code: 'ur', label: 'اردو',     flag: '🇵🇰', rtl: true  },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export const LANGUAGE_KEY = 'vault_ui_language';

export function isRTLLanguage(code: string): boolean {
  return SUPPORTED_LANGUAGES.find(l => l.code === code)?.rtl ?? false;
}

// ─── Detect device language ───────────────────────────────────────────────────

export function getDeviceLanguage(): LanguageCode {
  const locales = Localization.getLocales();
  const deviceCode = locales[0]?.languageCode ?? 'en';
  const supported = SUPPORTED_LANGUAGES.map(l => l.code) as string[];
  return (supported.includes(deviceCode) ? deviceCode : 'en') as LanguageCode;
}

// ─── Persist language preference ─────────────────────────────────────────────

export async function getStoredLanguage(): Promise<LanguageCode | null> {
  try {
    const val = await AsyncStorage.getItem(LANGUAGE_KEY);
    return val as LanguageCode | null;
  } catch {
    return null;
  }
}

export async function storeLanguage(code: LanguageCode): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, code).catch(() => {});
}

// ─── Initialize i18n (called once in _layout.tsx) ────────────────────────────

let initialized = false;

export async function initI18n(): Promise<LanguageCode> {
  if (initialized) return i18n.language as LanguageCode;
  initialized = true;

  const stored = await getStoredLanguage();
  const device  = getDeviceLanguage();
  const lng     = stored ?? device;

  // Apply RTL before rendering
  const needsRTL = isRTLLanguage(lng);
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(needsRTL);

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      fr: { translation: fr },
      tr: { translation: tr },
      fa: { translation: fa },
      ur: { translation: ur },
    },
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });

  return lng;
}

// ─── Change language at runtime ───────────────────────────────────────────────

export async function changeLanguage(code: LanguageCode): Promise<{ needsRestart: boolean }> {
  const currentRTL = isRTLLanguage(i18n.language);
  const newRTL     = isRTLLanguage(code);
  const rtlChanged = currentRTL !== newRTL;

  await i18n.changeLanguage(code);
  await storeLanguage(code);

  if (rtlChanged) {
    I18nManager.forceRTL(newRTL);
    return { needsRestart: true };
  }
  return { needsRestart: false };
}

export default i18n;
