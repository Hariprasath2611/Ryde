import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          return Promise.resolve(localStorage.getItem(key));
        }
      } catch {
        // Fallback for SSR or restricted storage
      }
      return Promise.resolve(null);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
      } catch {
        // Fallback
      }
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
      } catch {
        // Fallback
      }
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl =
  process.env['EXPO_PUBLIC_SUPABASE_URL'] || 'https://jpfwhdilnxmqcmexroke.supabase.co';
const supabaseAnonKey = process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] || 'mock-anon-key-placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
