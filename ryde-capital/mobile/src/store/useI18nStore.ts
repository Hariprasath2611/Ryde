import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { apiClient, getApiAuthToken } from '../services/api';

export type SupportedLocale = 'ta' | 'en' | 'hi' | 'te';

export const LOCALE_STORAGE_KEY = '@ryde_selected_locale';

/**
 * Detect device language. If matches one of the 4 supported languages, use it;
 * otherwise default strictly to Tamil ('ta').
 */
export function getDeviceLocale(): SupportedLocale {
  try {
    const locales = Localization.getLocales();
    const primary = locales?.[0]?.languageCode?.toLowerCase();
    if (primary === 'ta' || primary === 'en' || primary === 'hi' || primary === 'te') {
      return primary as SupportedLocale;
    }
  } catch (e) {
    console.warn('Failed to detect device locale:', e);
  }
  return 'ta';
}

interface I18nStoreState {
  locale: SupportedLocale;
  isLoaded: boolean;
  setLocale: (locale: SupportedLocale) => Promise<void>;
  loadPersistedLocale: () => Promise<SupportedLocale>;
}

export const useI18nStore = create<I18nStoreState>((set, get) => ({
  locale: getDeviceLocale(),
  isLoaded: false,

  setLocale: async (locale: SupportedLocale) => {
    try {
      await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch (e) {
      console.warn('Failed to persist locale to AsyncStorage:', e);
    }

    // Sync preferred_language with backend if authenticated
    try {
      const token = getApiAuthToken();
      if (token) {
        await apiClient('/drivers/me', {
          method: 'PATCH',
          body: JSON.stringify({ preferred_language: locale }),
        });
      }
    } catch {
      // Non-blocking background sync
    }

    set({ locale });
  },

  loadPersistedLocale: async () => {
    try {
      const saved = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
      if (saved && (saved === 'ta' || saved === 'en' || saved === 'hi' || saved === 'te')) {
        set({ locale: saved, isLoaded: true });
        return saved;
      }
    } catch (e) {
      console.warn('Failed to load persisted locale:', e);
    }

    const fallback = getDeviceLocale();
    set({ locale: fallback, isLoaded: true });
    return fallback;
  },
}));

