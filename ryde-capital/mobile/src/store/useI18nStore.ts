import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SupportedLocale = 'ta' | 'en' | 'hi' | 'te';

export const LOCALE_STORAGE_KEY = '@ryde_selected_locale';

interface I18nStoreState {
  locale: SupportedLocale;
  isLoaded: boolean;
  setLocale: (locale: SupportedLocale) => Promise<void>;
  loadPersistedLocale: () => Promise<SupportedLocale>;
}

export const useI18nStore = create<I18nStoreState>((set, get) => ({
  locale: 'en',
  isLoaded: false,

  setLocale: async (locale: SupportedLocale) => {
    try {
      await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch (e) {
      console.warn('Failed to persist locale to AsyncStorage:', e);
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
    set({ isLoaded: true });
    return get().locale;
  },
}));
