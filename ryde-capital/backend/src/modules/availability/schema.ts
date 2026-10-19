import { z } from 'zod';

export const setAvailabilitySchema = z
  .object({
    status: z.enum(['online', 'offline']).optional(),
    isAvailable: z.boolean().optional(),
    vehicleType: z.enum(['two_wheeler', 'three_wheeler', 'four_wheeler']).optional(),
  })
  .refine((data) => data.status !== undefined || data.isAvailable !== undefined, {
    message: 'Either status ("online" | "offline") or isAvailable (boolean) must be provided',
  });

export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>;
