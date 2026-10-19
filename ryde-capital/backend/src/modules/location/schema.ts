import { z } from 'zod';

export const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().nonnegative().optional(),
  accuracy: z.number().nonnegative().optional(),
  timestamp: z.string().datetime().optional(),
});

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
