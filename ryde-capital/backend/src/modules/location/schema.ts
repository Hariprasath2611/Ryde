import { z } from 'zod';

export const locationPointSchema = z.object({
  latitude: z.number().min(-90, 'Latitude must be >= -90').max(90, 'Latitude must be <= 90'),
  longitude: z
    .number()
    .min(-180, 'Longitude must be >= -180')
    .max(180, 'Longitude must be <= 180'),
  heading: z.number().min(0).max(360).optional().nullable(),
  speed: z.number().min(0, 'Speed must be non-negative').optional().nullable(),
  accuracy: z.number().min(0).optional().nullable(),
  recorded_at: z.string().or(z.number()).optional(),
  recordedAt: z.string().or(z.number()).optional(),
});

export const locationBatchSchema = z.object({
  locations: z
    .array(locationPointSchema)
    .min(1, 'Batch must contain at least 1 location point')
    .max(20, 'Batch cannot exceed 20 location points'),
});

export const locationInputSchema = z.union([
  locationPointSchema,
  locationBatchSchema,
  z.array(locationPointSchema).min(1).max(20),
]);

export type LocationPointInput = z.infer<typeof locationPointSchema>;
export type LocationBatchInput = z.infer<typeof locationBatchSchema>;
