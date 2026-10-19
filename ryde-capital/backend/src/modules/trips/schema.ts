// ryde-capital/backend/src/modules/trips/schema.ts
// Phase 4 Zod Validation Schemas for Trip Endpoints

import { z } from 'zod';

export const tripIdParamSchema = z.object({
  id: z.string().uuid('Invalid trip ID format'),
});

export const tripHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.string().optional(),
});

export const verifyOtpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'Trip OTP must be exactly 6 digits'),
});

export const handoverPhotoItemSchema = z.object({
  photoType: z.string().min(1),
  filePath: z.string().min(1),
});

export const vehicleHandoverSchema = z.object({
  odometerBefore: z.number().nonnegative('Odometer reading must be non-negative'),
  fuelLevelBefore: z.number().min(0).max(100, 'Fuel percentage must be between 0 and 100'),
  notes: z.string().optional(),
  existingDamageNotes: z.string().optional(),
  photos: z.array(handoverPhotoItemSchema).min(6, 'All 6 mandatory vehicle photos must be provided'),
});

export const endTripSchema = z.object({
  odometerAfter: z.number().nonnegative('Return odometer reading must be non-negative'),
  fuelLevelAfter: z.number().min(0).max(100).optional(),
  returnPhotos: z.array(handoverPhotoItemSchema).optional(),
  earlyDropReason: z.string().optional(),
  notes: z.string().optional(),
});

export const cancelTripSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason is required (minimum 3 characters)'),
});

export type TripIdParam = z.infer<typeof tripIdParamSchema>;
export type TripHistoryQuery = z.infer<typeof tripHistoryQuerySchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type VehicleHandoverInput = z.infer<typeof vehicleHandoverSchema>;
export type EndTripInput = z.infer<typeof endTripSchema>;
export type CancelTripInput = z.infer<typeof cancelTripSchema>;
