// ryde-capital/backend/src/modules/complaints/schema.ts
// Phase 5: Zod Validation Schemas for Complaints

import { z } from 'zod';

export const createComplaintSchema = z.object({
  tripId: z.string().uuid('Invalid trip ID format').optional(),
  complaintType: z.string().min(2, 'Complaint category is required'),
  description: z.string().min(5, 'Please provide detailed complaint description (min 5 characters)').max(2000),
});

export const getComplaintsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['filed', 'investigating', 'resolved', 'dismissed']).optional(),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type GetComplaintsQueryInput = z.infer<typeof getComplaintsQuerySchema>;
