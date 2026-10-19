import { z } from 'zod';

export const assignmentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const rejectAssignmentSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
});

export const listAssignmentsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type AssignmentIdParam = z.infer<typeof assignmentIdParamSchema>;
export type RejectAssignmentInput = z.infer<typeof rejectAssignmentSchema>;
export type ListAssignmentsQuery = z.infer<typeof listAssignmentsQuerySchema>;
