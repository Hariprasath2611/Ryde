import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SUPABASE_URL: z.string().url().default('https://example.supabase.co'),
  SUPABASE_ANON_KEY: z.string().min(1).default('placeholder-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('placeholder-service-role-key'),
  GOOGLE_MAPS_API_KEY: z.string().default('placeholder-maps-key'),
  SMS_PROVIDER_API_KEY: z.string().default('placeholder-sms-key'),
  SMS_PROVIDER_SENDER_ID: z.string().default('RYDEIN'),
  SMS_PROVIDER_TEMPLATE_ID: z.string().default('placeholder-template-id'),
  RAZORPAY_KEY_ID: z.string().default('placeholder-razorpay-key'),
  RAZORPAY_KEY_SECRET: z.string().default('placeholder-razorpay-secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('placeholder-webhook-secret'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // In development/test, we log errors; in production, we crash immediately
  console.error('❌ Invalid environment variables:', parsed.error.format());
  if (process.env['NODE_ENV'] === 'production') {
    process.exit(1);
  }
}

export const env = parsed.success ? parsed.data : envSchema.parse({});
export type Env = z.infer<typeof envSchema>;
