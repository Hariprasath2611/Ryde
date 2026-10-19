import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function createSupabaseServiceClient<Database = unknown>(
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

export function createSupabaseAnonClient<Database = unknown>(
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
