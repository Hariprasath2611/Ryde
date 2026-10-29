// ryde-capital/mobile/src/i18n/index.ts
// Multi-regional internationalization (i18n) for Ryde Capital
// Supported locales: Tamil (ta-IN, default), English (en-IN), Hindi (hi-IN), Telugu (te-IN)

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useI18nStore, SupportedLocale } from '../store/useI18nStore';
import { en } from './en';
import { ta } from './ta';
import { hi } from './hi';
import { te } from './te';
import type { TranslationSchema } from './types';

export type { SupportedLocale } from '../store/useI18nStore';
export type { TranslationSchema } from './types';

export const translations: Record<SupportedLocale, TranslationSchema> = {
  ta,
  en,
  hi,
  te,
};

// Initialize i18next instance
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: en },
      ta: { translation: ta },
      hi: { translation: hi },
      te: { translation: te },
    },
    lng: useI18nStore.getState().locale || 'ta',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
}

export interface LanguageOption {
  id: SupportedLocale;
  label: string;
  sublabel: string;
  script: string;
  badge?: string;
  ctaLabel: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    id: 'ta',
    label: 'தமிழ்',
    sublabel: 'Tamil · தமிழ்நாடு',
    script: 'தமிழ்',
    badge: 'Recommended',
    ctaLabel: 'தொடரவும் →',
  },
  {
    id: 'en',
    label: 'English',
    sublabel: 'English · Standard',
    script: 'English',
    ctaLabel: 'Continue →',
  },
  {
    id: 'hi',
    label: 'हिन्दी',
    sublabel: 'Hindi · हिंदी',
    script: 'हिन्दी',
    ctaLabel: 'आगे बढ़ें →',
  },
  {
    id: 'te',
    label: 'తెలుగు',
    sublabel: 'Telugu · తెలుగు',
    script: 'తెలుగు',
    ctaLabel: 'కొనసాగించండి →',
  },
];

export function getTranslation(locale: SupportedLocale): TranslationSchema {
  return translations[locale] || translations.en;
}

export function getLocaleDisplayName(locale: SupportedLocale): string {
  switch (locale) {
    case 'ta':
      return 'தமிழ் (Tamil)';
    case 'hi':
      return 'हिन्दी (Hindi)';
    case 'te':
      return 'తెలుగు (Telugu)';
    case 'en':
    default:
      return 'English';
  }
}

/**
 * Format currency with Indian lakh/crore grouping and ₹ symbol with Latin digits
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format numbers with Indian en-IN grouping with Latin digits
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

/**
 * Format dates with en-IN locale
 */
export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', options || {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * React hook for dynamic localization.
 * Automatically triggers re-render across screens when locale changes.
 */
export function useTranslation() {
  const locale = useI18nStore((state) => state.locale);
  const setLocale = useI18nStore((state) => state.setLocale);
  const t = translations[locale] || translations.en;

  return {
    t,
    locale,
    setLocale,
    formatCurrency,
    formatNumber,
    formatDate,
    i18n,
  };
}

// Global non-hook fallback for static lookups
export function t(): TranslationSchema {
  const current = useI18nStore.getState().locale;
  return translations[current] || translations.en;
}

export { en, ta, hi, te, i18n };
export default en;

