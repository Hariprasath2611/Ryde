import { createSupabaseServiceClient } from '@ryde/shared';
import { env } from './env.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseServiceClient = createSupabaseServiceClient<any>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);
