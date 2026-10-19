// ryde-capital/backend/src/modules/driver/schema.ts
// Zod schemas for Phase 2 driver onboarding, profile updates, and document uploads

import { z } from 'zod';
import { VEHICLE_TYPE, type VehicleType } from '@ryde/shared';

// Helper to validate age >= 18 years
function validateAtLeast18YearsOld(dobStr: string): boolean {
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return false;

  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  const d = today.getDate() - dob.getDate();

  const adjustedAge = m < 0 || (m === 0 && d < 0) ? age - 1 : age;
  return adjustedAge >= 18;
}

export const updateDriverProfileSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must have at least 2 characters').optional(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
      .refine(validateAtLeast18YearsOld, {
        message: 'Driver must be at least 18 years of age to register',
      })
      .optional(),
    addressLine: z.string().min(3, 'Address line must have at least 3 characters').optional(),
    city: z.string().min(2, 'City must have at least 2 characters').optional(),
    state: z.string().min(2, 'State must have at least 2 characters').optional(),
    pincode: z
      .string()
      .regex(/^[1-9][0-9]{5}$/, 'Pincode must be a valid 6-digit Indian postal code')
      .optional(),
    experienceYears: z
      .number()
      .int()
      .min(0, 'Experience cannot be negative')
      .max(60, 'Experience exceeds realistic maximum')
      .optional(),
    allowedVehicleTypes: z
      .array(
        z.enum([
          VEHICLE_TYPE.TWO_WHEELER,
          VEHICLE_TYPE.THREE_WHEELER,
          VEHICLE_TYPE.FOUR_WHEELER,
        ] as [VehicleType, ...VehicleType[]]),
      )
      .min(1, 'At least one vehicle type must be selected')
      .optional(),
  })
  .strict();

export const createUploadUrlSchema = z
  .object({
    type: z.enum(['id_proof', 'license_front', 'license_back', 'profile_photo']),
    contentType: z.enum(['image/jpeg', 'image/png', 'application/pdf']),
    size: z
      .number()
      .positive('File size must be positive')
      .max(5 * 1024 * 1024, 'File size must not exceed 5 MB'),
  })
  .refine(
    data => {
      // Profile photo must be an image, not PDF
      if (data.type === 'profile_photo' && data.contentType === 'application/pdf') {
        return false;
      }
      return true;
    },
    {
      message: 'Profile photo must be an image (JPEG or PNG), PDF is not permitted',
      path: ['contentType'],
    },
  );

export const confirmDocumentSchema = z.object({
  type: z.enum(['id_proof', 'license_front', 'license_back', 'profile_photo']),
  filePath: z.string().min(5, 'Valid file path is required'),
  // Identity proof fields
  documentType: z.enum(['aadhaar', 'pan', 'voter_id', 'passport']).optional(),
  maskedReference: z.string().min(4, 'Masked reference is required (e.g. XXXX-1234)').optional(),
  // Driving license fields
  licenseNumberMasked: z.string().min(4).optional(),
  licenseClasses: z
    .array(z.string())
    .min(1, 'License classes must include at least one class')
    .optional(),
  expiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format')
    .optional(),
  frontFilePath: z.string().optional(),
  backFilePath: z.string().optional(),
});

export type UpdateDriverProfileInput = z.infer<typeof updateDriverProfileSchema>;
export type CreateUploadUrlInput = z.infer<typeof createUploadUrlSchema>;
export type ConfirmDocumentInput = z.infer<typeof confirmDocumentSchema>;
