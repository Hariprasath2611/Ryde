import { z } from 'zod';

export const updateDriverProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  emergencyPhone: z.string().optional(),
});

export const uploadDocumentSchema = z.object({
  documentType: z.enum(['driving_license', 'aadhaar', 'pan', 'police_verification']),
  documentNumber: z.string().min(1),
  documentUrl: z.string().url(),
});

export type UpdateDriverProfileInput = z.infer<typeof updateDriverProfileSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
