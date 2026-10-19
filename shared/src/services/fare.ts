// shared/src/services/fare.ts
// Phase 4: Fare Calculation Engine & Payment Provider Interface

import type { VehicleType } from '../constants/index.js';

export interface FareRule {
  id?: string;
  vehicleType: VehicleType;
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  freeWaitingMinutes: number;
  waitingChargePerMinute: number;
  platformFeePercent: number;
  taxPercent: number;
  minimumFare: number;
}

export interface FareCalculationInput {
  distanceKm: number;
  durationMinutes: number;
  waitingMinutes: number;
  rule: FareRule;
  discount?: number;
}

export interface FareBreakdown {
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  waitingCharge: number;
  billableWaitingMinutes: number;
  subtotal: number;
  isMinimumFareApplied: boolean;
  fareBeforeTax: number;
  discount: number;
  platformFee: number;
  tax: number;
  totalAmount: number;
  driverEarnings: number;
  currency: string;
}

function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates itemized trip fare breakdown according to vehicle fare rules.
 */
export function calculateFare(input: FareCalculationInput): FareBreakdown {
  const { distanceKm, durationMinutes, waitingMinutes, rule, discount = 0 } = input;

  const validDistance = Math.max(0, distanceKm);
  const validDuration = Math.max(0, durationMinutes);
  const validWaiting = Math.max(0, waitingMinutes);

  const baseFare = round2(rule.baseFare);
  const distanceCharge = round2(validDistance * rule.perKmRate);
  const timeCharge = round2(validDuration * rule.perMinuteRate);

  const billableWaitingMinutes = Math.max(0, Math.ceil(validWaiting - rule.freeWaitingMinutes));
  const waitingCharge = round2(billableWaitingMinutes * rule.waitingChargePerMinute);

  const subtotal = round2(baseFare + distanceCharge + timeCharge + waitingCharge);
  const isMinimumFareApplied = subtotal < rule.minimumFare;
  const fareBeforeDiscount = Math.max(subtotal, rule.minimumFare);

  const validDiscount = Math.min(fareBeforeDiscount, Math.max(0, discount));
  const fareBeforeTax = round2(fareBeforeDiscount - validDiscount);

  const platformFee = round2(fareBeforeTax * (rule.platformFeePercent / 100));
  const tax = round2(fareBeforeTax * (rule.taxPercent / 100));
  const totalAmount = round2(fareBeforeTax + tax);
  const driverEarnings = round2(fareBeforeTax - platformFee);

  return {
    baseFare,
    distanceCharge,
    timeCharge,
    waitingCharge,
    billableWaitingMinutes,
    subtotal,
    isMinimumFareApplied,
    fareBeforeTax,
    discount: validDiscount,
    platformFee,
    tax,
    totalAmount,
    driverEarnings,
    currency: 'INR',
  };
}

export interface ChargeParams {
  tripId: string;
  customerId: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  status: 'captured' | 'failed';
  amount: number;
  errorMessage?: string;
}

export interface PaymentProvider {
  charge(params: ChargeParams): Promise<PaymentResult>;
}

export class MockPaymentProvider implements PaymentProvider {
  constructor(private shouldFail = false) {}

  async charge(params: ChargeParams): Promise<PaymentResult> {
    if (this.shouldFail) {
      return {
        success: false,
        transactionId: `mock-fail-${Date.now()}`,
        status: 'failed',
        amount: params.amount,
        errorMessage: 'Mock payment authorization failed',
      };
    }

    return {
      success: true,
      transactionId: `mock-txn-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      status: 'captured',
      amount: params.amount,
    };
  }
}

export const mockPaymentProvider = new MockPaymentProvider();
