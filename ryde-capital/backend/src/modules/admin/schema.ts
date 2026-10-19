// ryde-capital/backend/src/modules/admin/schema.ts
// Zod schemas for Admin driver review, list queries, and approval/rejection

import { z } from 'zod';
import { DRIVER_ONBOARDING_STATUS, type DriverOnboardingStatus } from '@ryde/shared';

export const listDriversQuerySchema = z.object({
  status: z
    .enum([
      DRIVER_ONBOARDING_STATUS.NOT_STARTED,
      DRIVER_ONBOARDING_STATUS.IN_PROGRESS,
      DRIVER_ONBOARDING_STATUS.SUBMITTED,
      DRIVER_ONBOARDING_STATUS.UNDER_REVIEW,
      DRIVER_ONBOARDING_STATUS.APPROVED,
      DRIVER_ONBOARDING_STATUS.REJECTED,
    ] as [DriverOnboardingStatus, ...DriverOnboardingStatus[]])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const rejectDriverSchema = z.object({
  reason: z
    .string()
    .min(5, 'Rejection reason must be at least 5 characters long')
    .max(500, 'Rejection reason must not exceed 500 characters'),
});

export type ListDriversQueryInput = z.infer<typeof listDriversQuerySchema>;
export type RejectDriverInput = z.infer<typeof rejectDriverSchema>;
