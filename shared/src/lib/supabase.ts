import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSupabaseServiceClient<Database = any>(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase URL and Service Role Key are required to create a service client');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSupabaseAnonClient<Database = any>(
  supabaseUrl: string,
  supabaseAnonKey: string,
): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required to create an anon client');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}
