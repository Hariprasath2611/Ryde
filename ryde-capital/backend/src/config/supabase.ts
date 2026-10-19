import { createSupabaseServiceClient } from '@ryde/shared';
import { env } from './env.js';

export const supabaseServiceClient = createSupabaseServiceClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);
