import { createClient } from '@supabase/supabase-js';
import { safeStorage } from './storage';

const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> => safeStorage.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> => safeStorage.setItemAsync(key, value),
  removeItem: (key: string): Promise<void> => safeStorage.deleteItemAsync(key),
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
