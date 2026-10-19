import { z } from 'zod';

export const setAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
  vehicleType: z.enum(['two_wheeler', 'three_wheeler', 'four_wheeler']).optional(),
});

export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>;
