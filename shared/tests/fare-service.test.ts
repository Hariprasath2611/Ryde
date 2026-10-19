import { describe, it, expect } from 'vitest';
import {
  calculateFare,
  MockPaymentProvider,
  type FareRule,
} from '../src/services/fare.js';

describe('Fare Calculation Service (Table-driven tests)', () => {
  const fourWheelerRule: FareRule = {
    vehicleType: 'four_wheeler',
    baseFare: 80.0,
    perKmRate: 16.0,
    perMinuteRate: 2.0,
    freeWaitingMinutes: 5,
    waitingChargePerMinute: 3.0,
    platformFeePercent: 15.0,
    taxPercent: 5.0,
    minimumFare: 100.0,
  };

  const twoWheelerRule: FareRule = {
    vehicleType: 'two_wheeler',
    baseFare: 30.0,
    perKmRate: 8.0,
    perMinuteRate: 1.0,
    freeWaitingMinutes: 5,
    waitingChargePerMinute: 1.5,
    platformFeePercent: 15.0,
    taxPercent: 5.0,
    minimumFare: 40.0,
  };

  const testCases = [
    {
      description: 'Standard 10km, 25min four-wheeler ride with 3min waiting (within 5min free window)',
      rule: fourWheelerRule,
      distanceKm: 10,
      durationMinutes: 25,
      waitingMinutes: 3,
      discount: 0,
      expected: {
        baseFare: 80.0,
        distanceCharge: 160.0, // 10 * 16
        timeCharge: 50.0, // 25 * 2
        waitingCharge: 0.0, // 3 <= 5
        subtotal: 290.0, // 80 + 160 + 50
        isMinimumFareApplied: false,
        fareBeforeTax: 290.0,
        platformFee: 43.5, // 15% of 290
        tax: 14.5, // 5% of 290
        totalAmount: 304.5, // 290 + 14.5
        driverEarnings: 246.5, // 290 - 43.5
      },
    },
    {
      description: 'Short four-wheeler trip below minimum fare: 0.5km, 2min, 0min waiting',
      rule: fourWheelerRule,
      distanceKm: 0.5,
      durationMinutes: 2,
      waitingMinutes: 0,
      discount: 0,
      expected: {
        baseFare: 80.0,
        distanceCharge: 8.0, // 0.5 * 16
        timeCharge: 4.0, // 2 * 2
        waitingCharge: 0.0,
        subtotal: 92.0, // 80 + 8 + 4 = 92 < 100
        isMinimumFareApplied: true,
        fareBeforeTax: 100.0, // minimum fare enforced
        platformFee: 15.0, // 15% of 100
        tax: 5.0, // 5% of 100
        totalAmount: 105.0, // 100 + 5
        driverEarnings: 85.0, // 100 - 15
      },
    },
    {
      description: 'Four-wheeler trip with excess waiting: 5km, 15min, 12min waiting (7min billable)',
      rule: fourWheelerRule,
      distanceKm: 5,
      durationMinutes: 15,
      waitingMinutes: 12, // 12 - 5 = 7 billable
      discount: 0,
      expected: {
        baseFare: 80.0,
        distanceCharge: 80.0, // 5 * 16
        timeCharge: 30.0, // 15 * 2
        waitingCharge: 21.0, // 7 * 3
        subtotal: 211.0, // 80 + 80 + 30 + 21
        isMinimumFareApplied: false,
        fareBeforeTax: 211.0,
        platformFee: 31.65, // 15% of 211
        tax: 10.55, // 5% of 211
        totalAmount: 221.55, // 211 + 10.55
        driverEarnings: 179.35, // 211 - 31.65
      },
    },
    {
      description: 'Two-wheeler trip: 8km, 20min, 10min waiting (5min billable)',
      rule: twoWheelerRule,
      distanceKm: 8,
      durationMinutes: 20,
      waitingMinutes: 10, // 10 - 5 = 5 billable
      discount: 0,
      expected: {
        baseFare: 30.0,
        distanceCharge: 64.0, // 8 * 8
        timeCharge: 20.0, // 20 * 1
        waitingCharge: 7.5, // 5 * 1.5
        subtotal: 121.5, // 30 + 64 + 20 + 7.5
        isMinimumFareApplied: false,
        fareBeforeTax: 121.5,
        platformFee: 18.23, // 15% of 121.5 = 18.225 -> 18.23
        tax: 6.08, // 5% of 121.5 = 6.075 -> 6.08
        totalAmount: 127.58, // 121.5 + 6.08
        driverEarnings: 103.27, // 121.5 - 18.23
      },
    },
  ];

  testCases.forEach((tc) => {
    it(tc.description, () => {
      const result = calculateFare({
        distanceKm: tc.distanceKm,
        durationMinutes: tc.durationMinutes,
        waitingMinutes: tc.waitingMinutes,
        rule: tc.rule,
        discount: tc.discount,
      });

      expect(result.baseFare).toBe(tc.expected.baseFare);
      expect(result.distanceCharge).toBe(tc.expected.distanceCharge);
      expect(result.timeCharge).toBe(tc.expected.timeCharge);
      expect(result.waitingCharge).toBe(tc.expected.waitingCharge);
      expect(result.subtotal).toBe(tc.expected.subtotal);
      expect(result.isMinimumFareApplied).toBe(tc.expected.isMinimumFareApplied);
      expect(result.fareBeforeTax).toBe(tc.expected.fareBeforeTax);
      expect(result.platformFee).toBe(tc.expected.platformFee);
      expect(result.tax).toBe(tc.expected.tax);
      expect(result.totalAmount).toBe(tc.expected.totalAmount);
      expect(result.driverEarnings).toBe(tc.expected.driverEarnings);
    });
  });

  describe('MockPaymentProvider', () => {
    it('successfully charges and returns captured status', async () => {
      const provider = new MockPaymentProvider(false);
      const res = await provider.charge({
        tripId: 'test-trip-id',
        customerId: 'test-customer-id',
        amount: 250.0,
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe('captured');
      expect(res.transactionId).toContain('mock-txn');
      expect(res.amount).toBe(250.0);
    });

    it('returns failure when configured to fail', async () => {
      const provider = new MockPaymentProvider(true);
      const res = await provider.charge({
        tripId: 'test-trip-id',
        customerId: 'test-customer-id',
        amount: 250.0,
      });

      expect(res.success).toBe(false);
      expect(res.status).toBe('failed');
      expect(res.errorMessage).toBeDefined();
    });
  });
});
