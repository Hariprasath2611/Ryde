import { z } from 'zod';

export const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const completeSignupSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format').optional(),
  allowed_vehicle_types: z.array(z.enum(['two_wheeler', 'three_wheeler', 'four_wheeler'])).optional(),
  role: z.string().optional(), // Accepted in schema so client can send it, but IGNORED by server
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CompleteSignupInput = z.infer<typeof completeSignupSchema>;
