import { z } from 'zod';

export const tripSosParamSchema = z.object({
  id: z.string().uuid(),
});

export const triggerSosSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  reason: z.string().optional(),
});

export const createEmergencyContactSchema = z.object({
  name: z.string().min(2),
  relationship: z.string().min(2),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format'),
  isPrimary: z.boolean().default(false),
});

export type TripSosParam = z.infer<typeof tripSosParamSchema>;
export type TriggerSosInput = z.infer<typeof triggerSosSchema>;
export type CreateEmergencyContactInput = z.infer<typeof createEmergencyContactSchema>;
