import { z } from 'zod';

export const getEarningsQuerySchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  period: z.enum(['daily', 'weekly', 'monthly']).optional(),
});

export type GetEarningsQueryInput = z.infer<typeof getEarningsQuerySchema>;
