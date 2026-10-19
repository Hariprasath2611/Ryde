// ryde-capital/backend/src/modules/earnings/schema.ts
// Phase 5: Zod Validation Schemas for Earnings & Payout Accounts

import { z } from 'zod';

export const getEarningsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  period: z.enum(['today', 'week', 'month', 'all']).default('all'),
});

export const payoutAccountIdParamSchema = z.object({
  id: z.string().uuid('Invalid payout account ID format'),
});

export const createPayoutAccountSchema = z
  .object({
    accountType: z.enum(['upi', 'bank_account'], {
      required_error: 'accountType must be either "upi" or "bank_account"',
    }),
    upiId: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    bankName: z.string().optional(),
    beneficiaryName: z.string().min(2, 'Beneficiary name must be at least 2 characters'),
    isDefault: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      if (data.accountType === 'upi') {
        return !!data.upiId && data.upiId.trim().length > 3;
      }
      if (data.accountType === 'bank_account') {
        return !!data.accountNumber && !!data.ifscCode;
      }
      return false;
    },
    {
      message: 'UPI account requires upiId; Bank account requires accountNumber and ifscCode',
      path: ['accountType'],
    },
  );

export type GetEarningsQueryInput = z.infer<typeof getEarningsQuerySchema>;
export type PayoutAccountIdParam = z.infer<typeof payoutAccountIdParamSchema>;
export type CreatePayoutAccountInput = z.infer<typeof createPayoutAccountSchema>;
