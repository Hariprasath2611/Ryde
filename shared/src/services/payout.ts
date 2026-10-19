// shared/src/services/payout.ts
// Phase 5: Payout Provider Interface & Mock Implementation with Masking and Validation

export interface VerifyPayoutAccountInput {
  accountType: 'upi' | 'bank_account';
  upiId?: string;
  accountNumber?: string;
  ifscCode?: string;
  beneficiaryName: string;
}

export interface VerifyPayoutAccountResult {
  verified: boolean;
  providerToken: string;
  beneficiaryName: string;
  accountNumberMasked?: string;
  upiIdMasked?: string;
  error?: string;
}

export interface SettlePayoutInput {
  driverId: string;
  payoutAccountId: string;
  amount: number;
  currency?: string;
}

export interface SettlePayoutResult {
  payoutId: string;
  status: 'settled' | 'failed';
  settledAt: string;
  error?: string;
}

export interface IPayoutProvider {
  verifyAccount(input: VerifyPayoutAccountInput): Promise<VerifyPayoutAccountResult>;
  settlePayout(input: SettlePayoutInput): Promise<SettlePayoutResult>;
}

/**
 * Validates Indian UPI ID format (e.g., username@bank, 9876543210@paytm)
 */
export function isValidUpiId(upiId: string): boolean {
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId.trim());
}

/**
 * Validates Indian Financial System Code (IFSC) format: 4 uppercase chars, '0', 6 alphanumeric
 */
export function isValidIfsc(ifsc: string): boolean {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc.trim().toUpperCase());
}

/**
 * Validates Indian Bank Account Number (between 9 and 18 digits)
 */
export function isValidAccountNumber(accountNumber: string): boolean {
  const accountRegex = /^\d{9,18}$/;
  return accountRegex.test(accountNumber.trim());
}

/**
 * Masks a UPI ID: "rahul.sharma@okaxis" -> "ra***@okaxis"
 */
export function maskUpiId(upiId: string): string {
  const parts = upiId.trim().split('@');
  if (parts.length !== 2) return '***@***';
  const [user, handle] = parts;
  if (!user || user.length <= 2) {
    return `${user || ''}***@${handle}`;
  }
  return `${user.slice(0, 2)}***@${handle}`;
}

/**
 * Masks an account number: "123456789012" -> "********9012"
 */
export function maskAccountNumber(accountNumber: string): string {
  const cleaned = accountNumber.trim();
  if (cleaned.length <= 4) return '****';
  const last4 = cleaned.slice(-4);
  return '*'.repeat(Math.min(8, cleaned.length - 4)) + last4;
}

export class MockPayoutProvider implements IPayoutProvider {
  private settlementCounter = 1000;

  async verifyAccount(input: VerifyPayoutAccountInput): Promise<VerifyPayoutAccountResult> {
    if (input.accountType === 'upi') {
      if (!input.upiId || !isValidUpiId(input.upiId)) {
        return {
          verified: false,
          providerToken: '',
          beneficiaryName: input.beneficiaryName,
          error: 'Invalid UPI ID format. Expected format: username@bank',
        };
      }
      return {
        verified: true,
        providerToken: `mock_payout_tok_upi_${Date.now()}`,
        beneficiaryName: input.beneficiaryName.trim(),
        upiIdMasked: maskUpiId(input.upiId),
      };
    }

    if (input.accountType === 'bank_account') {
      if (!input.accountNumber || !isValidAccountNumber(input.accountNumber)) {
        return {
          verified: false,
          providerToken: '',
          beneficiaryName: input.beneficiaryName,
          error: 'Invalid bank account number. Expected 9 to 18 digits.',
        };
      }
      if (!input.ifscCode || !isValidIfsc(input.ifscCode)) {
        return {
          verified: false,
          providerToken: '',
          beneficiaryName: input.beneficiaryName,
          error: 'Invalid IFSC code format. Expected 4 letters, 0, followed by 6 alphanumeric characters.',
        };
      }
      return {
        verified: true,
        providerToken: `mock_payout_tok_bank_${Date.now()}`,
        beneficiaryName: input.beneficiaryName.trim(),
        accountNumberMasked: maskAccountNumber(input.accountNumber),
      };
    }

    return {
      verified: false,
      providerToken: '',
      beneficiaryName: input.beneficiaryName,
      error: 'Unsupported payout account type',
    };
  }

  async settlePayout(input: SettlePayoutInput): Promise<SettlePayoutResult> {
    if (input.amount <= 0) {
      return {
        payoutId: '',
        status: 'failed',
        settledAt: new Date().toISOString(),
        error: 'Payout amount must be greater than zero',
      };
    }

    this.settlementCounter++;
    return {
      payoutId: `payout_mock_settle_${this.settlementCounter}_${Date.now()}`,
      status: 'settled',
      settledAt: new Date().toISOString(),
    };
  }
}

export const mockPayoutProvider = new MockPayoutProvider();
