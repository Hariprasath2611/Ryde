// ryde-capital/backend/src/modules/earnings/service.ts
// Phase 5: Earnings, Payout Account Management, and Settlement Service

import {
  BadRequestError,
  NotFoundError,
  mockPayoutProvider,
  type IPayoutProvider,
} from '@ryde/shared';
import {
  earningsRepository,
  type IEarningsRepository,
} from './repository.js';
import type { CreatePayoutAccountInput, GetEarningsQueryInput } from './schema.js';


export class EarningsService {
  constructor(
    private repo: IEarningsRepository = earningsRepository,
    private payoutProvider: IPayoutProvider = mockPayoutProvider,
  ) {}

  private async getDriverOrThrow(userId: string) {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }
    return driver;
  }

  async getEarningsSummary(userId: string) {
    const driver = await this.getDriverOrThrow(userId);
    return this.repo.getEarningsSummary(driver.id);
  }

  async getEarningsList(userId: string, query: GetEarningsQueryInput) {
    const driver = await this.getDriverOrThrow(userId);
    const { earnings, total } = await this.repo.getEarningsList(
      driver.id,
      query.page,
      query.limit,
      query.period,
    );

    return {
      earnings,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  async getPayoutAccounts(userId: string) {
    const driver = await this.getDriverOrThrow(userId);
    return this.repo.getPayoutAccounts(driver.id);
  }

  async createPayoutAccount(userId: string, input: CreatePayoutAccountInput) {
    const driver = await this.getDriverOrThrow(userId);

    // Verify account via payout provider
    const verification = await this.payoutProvider.verifyAccount({
      accountType: input.accountType,
      upiId: input.upiId,
      accountNumber: input.accountNumber,
      ifscCode: input.ifscCode,
      beneficiaryName: input.beneficiaryName,
    });

    if (!verification.verified) {
      throw new BadRequestError(verification.error || 'Payout account verification failed');
    }

    const existingAccounts = await this.repo.getPayoutAccounts(driver.id);
    const isFirstAccount = existingAccounts.length === 0;
    const shouldBeDefault = input.isDefault || isFirstAccount;

    const created = await this.repo.createPayoutAccount({
      driver_id: driver.id,
      account_type: input.accountType,
      upi_id: verification.upiIdMasked || null,
      bank_name: input.bankName || null,
      account_number_masked: verification.accountNumberMasked || null,
      ifsc_code: input.ifscCode ? input.ifscCode.toUpperCase().trim() : null,
      beneficiary_name: verification.beneficiaryName,
      provider_token: verification.providerToken,
      is_default: shouldBeDefault,
      verification_status: 'approved',
    });

    return created;
  }

  async setDefaultPayoutAccount(userId: string, accountId: string) {
    const driver = await this.getDriverOrThrow(userId);
    const account = await this.repo.getPayoutAccountById(driver.id, accountId);
    if (!account) {
      throw new NotFoundError('Payout account not found');
    }

    await this.repo.setDefaultPayoutAccount(driver.id, accountId);
    return { success: true, message: 'Default payout account updated' };
  }

  async deletePayoutAccount(userId: string, accountId: string) {
    const driver = await this.getDriverOrThrow(userId);
    const account = await this.repo.getPayoutAccountById(driver.id, accountId);
    if (!account) {
      throw new NotFoundError('Payout account not found');
    }

    await this.repo.deletePayoutAccount(driver.id, accountId);
    return { success: true, message: 'Payout account removed' };
  }

  async settleWeeklyEarnings() {
    const pendingBatches = await this.repo.getPendingEarningsByDriver();
    const results = [];

    for (const batch of pendingBatches) {
      const defaultAccount = await this.repo.getDefaultPayoutAccount(batch.driverId);
      if (!defaultAccount) {
        // Driver has no default payout account configured; skip settlement for this cycle
        continue;
      }

      if (batch.totalNet <= 0) {
        continue;
      }

      // Settle via mock provider
      const settlement = await this.payoutProvider.settlePayout({
        driverId: batch.driverId,
        payoutAccountId: defaultAccount.id,
        amount: batch.totalNet,
      });

      if (settlement.status === 'settled') {
        await this.repo.markEarningsSettled(batch.earningIds);

        // Settlement notification dispatch placeholder
        try {
          // Notifications dispatched asynchronously
        } catch (_e) {
          // Non-blocking notification dispatch
        }

        results.push({
          driverId: batch.driverId,
          amount: batch.totalNet,
          payoutId: settlement.payoutId,
          status: 'settled',
        });
      }
    }

    return results;
  }
}

export const earningsService = new EarningsService();
