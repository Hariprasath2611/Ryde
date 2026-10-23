// ryde-capital/mobile/src/i18n/index.ts
// Multi-regional internationalization (i18n) for Ryde Capital
// Supported locales: Tamil (ta-IN), English (en-IN), Hindi (hi-IN), Telugu (te-IN)

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
  };
}

// Global non-hook fallback for static lookups
export function t(): TranslationSchema {
  const current = useI18nStore.getState().locale;
  return translations[current] || translations.en;
}

export { en, ta, hi, te };
export default en;
