import { z } from 'zod';

export const assignmentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const rejectAssignmentSchema = z.object({
  reason: z.string().min(3).optional(),
});

export type AssignmentIdParam = z.infer<typeof assignmentIdParamSchema>;
export type RejectAssignmentInput = z.infer<typeof rejectAssignmentSchema>;
