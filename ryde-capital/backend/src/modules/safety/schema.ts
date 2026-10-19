// ryde-capital/backend/src/modules/safety/schema.ts
// Phase 5: Zod Validation Schemas for Safety, SOS, Emergency Contacts & Trip Sharing

import { z } from 'zod';
import { isValidIndianPhone } from '@ryde/shared';

export const tripSosParamSchema = z.object({
  id: z.string().uuid('Invalid trip ID format'),
});

export const sosIdParamSchema = z.object({
  id: z.string().uuid('Invalid SOS ID format'),
});

export const contactIdParamSchema = z.object({
  id: z.string().uuid('Invalid contact ID format'),
});

export const shareTokenParamSchema = z.object({
  token: z.string().min(16, 'Invalid share token format'),
});

export const triggerSosSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  reason: z.string().optional(),
});

export const cancelSosSchema = z.object({
  reason: z.string().optional().default('False alarm reported by driver'),
});

export const acknowledgeSosSchema = z.object({
  notes: z.string().optional(),
});

export const resolveSosSchema = z.object({
  notes: z.string().min(3, 'Resolution notes are required (min 3 characters)'),
});

export const createEmergencyContactSchema = z.object({
  name: z.string().min(2, 'Contact name must be at least 2 characters'),
  relationship: z.string().min(2, 'Relationship must be at least 2 characters'),
  phone: z
    .string()
    .refine((val) => isValidIndianPhone(val) || /^\+?[1-9]\d{9,14}$/.test(val.trim()), {
      message: 'Invalid phone number format. Must be a valid Indian (+91) or E.164 phone number',
    }),
  isPrimary: z.boolean().optional().default(false),
});

export const updateEmergencyContactSchema = z.object({
  name: z.string().min(2).optional(),
  relationship: z.string().min(2).optional(),
  phone: z
    .string()
    .refine((val) => isValidIndianPhone(val) || /^\+?[1-9]\d{9,14}$/.test(val.trim()), {
      message: 'Invalid phone number format. Must be a valid Indian (+91) or E.164 phone number',
    })
    .optional(),
  isPrimary: z.boolean().optional(),
});

export type TripSosParam = z.infer<typeof tripSosParamSchema>;
export type SosIdParam = z.infer<typeof sosIdParamSchema>;
export type ContactIdParam = z.infer<typeof contactIdParamSchema>;
export type ShareTokenParam = z.infer<typeof shareTokenParamSchema>;
export type TriggerSosInput = z.infer<typeof triggerSosSchema>;
export type CancelSosInput = z.infer<typeof cancelSosSchema>;
export type AcknowledgeSosInput = z.infer<typeof acknowledgeSosSchema>;
export type ResolveSosInput = z.infer<typeof resolveSosSchema>;
export type CreateEmergencyContactInput = z.infer<typeof createEmergencyContactSchema>;
export type UpdateEmergencyContactInput = z.infer<typeof updateEmergencyContactSchema>;
