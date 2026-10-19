import { z } from 'zod';

export const tripIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const verifyOtpSchema = z.object({
  otp: z.string().length(6, 'Trip OTP must be 6 digits'),
});

export const vehicleHandoverSchema = z.object({
  odometerReading: z.number().positive(),
  fuelLevel: z.enum(['low', 'quarter', 'half', 'three_quarters', 'full']).optional(),
  checklistPassed: z.boolean(),
  notes: z.string().optional(),
});

export const endTripSchema = z.object({
  odometerReading: z.number().positive(),
  tollAmount: z.number().nonnegative().optional(),
  parkingAmount: z.number().nonnegative().optional(),
});

export type TripIdParam = z.infer<typeof tripIdParamSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type VehicleHandoverInput = z.infer<typeof vehicleHandoverSchema>;
export type EndTripInput = z.infer<typeof endTripSchema>;
