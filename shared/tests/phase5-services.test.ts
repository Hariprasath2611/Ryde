// shared/tests/phase5-services.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidUpiId,
  isValidIfsc,
  isValidAccountNumber,
  maskUpiId,
  maskAccountNumber,
  MockPayoutProvider,
  isValidIndianPhone,
  MockSmsProvider,
  isExpoPushToken,
  buildPushMessage,
  PushNotificationService,
} from '../src/services/index.js';

describe('Phase 5 Shared Services Tests', () => {
  describe('Payout Account Validation & Masking', () => {
    it('validates UPI ID format accurately', () => {
      expect(isValidUpiId('rahul@okaxis')).toBe(true);
      expect(isValidUpiId('driver.123@okhdfcbank')).toBe(true);
      expect(isValidUpiId('9876543210@paytm')).toBe(true);

      expect(isValidUpiId('invalid-upi')).toBe(false);
      expect(isValidUpiId('@bank')).toBe(false);
      expect(isValidUpiId('user@')).toBe(false);
      expect(isValidUpiId('user@@bank')).toBe(false);
    });

    it('validates IFSC code format accurately', () => {
      expect(isValidIfsc('HDFC0001234')).toBe(true);
      expect(isValidIfsc('SBIN0000456')).toBe(true);
      expect(isValidIfsc('icic0007890')).toBe(true); // Case-insensitive

      expect(isValidIfsc('HDFC1001234')).toBe(false); // 5th char must be 0
      expect(isValidIfsc('HDF0001234')).toBe(false); // Too short
      expect(isValidIfsc('HDFCC0012345')).toBe(false); // Too long
    });

    it('validates bank account number length (9 to 18 digits)', () => {
      expect(isValidAccountNumber('123456789')).toBe(true);
      expect(isValidAccountNumber('123456789012345')).toBe(true);
      expect(isValidAccountNumber('123456789012345678')).toBe(true);

      expect(isValidAccountNumber('12345678')).toBe(false); // < 9 digits
      expect(isValidAccountNumber('1234567890123456789')).toBe(false); // > 18 digits
      expect(isValidAccountNumber('1234567890A')).toBe(false); // Non-digit
    });

    it('masks UPI IDs preserving privacy', () => {
      expect(maskUpiId('rahul.sharma@okaxis')).toBe('ra***@okaxis');
      expect(maskUpiId('d@paytm')).toBe('d***@paytm');
    });

    it('masks bank account numbers showing only the last 4 digits', () => {
      expect(maskAccountNumber('123456789012')).toBe('********9012');
      expect(maskAccountNumber('987654321')).toBe('*****4321');
    });

    it('verifies UPI account via MockPayoutProvider', async () => {
      const provider = new MockPayoutProvider();
      const validRes = await provider.verifyAccount({
        accountType: 'upi',
        upiId: 'driver@okaxis',
        beneficiaryName: 'Rahul Sharma',
      });
      expect(validRes.verified).toBe(true);
      expect(validRes.upiIdMasked).toBe('dr***@okaxis');
      expect(validRes.providerToken).toMatch(/^mock_payout_tok_upi_/);

      const invalidRes = await provider.verifyAccount({
        accountType: 'upi',
        upiId: 'invalid-upi-id',
        beneficiaryName: 'Rahul Sharma',
      });
      expect(invalidRes.verified).toBe(false);
      expect(invalidRes.error).toContain('Invalid UPI ID');
    });

    it('verifies Bank account via MockPayoutProvider', async () => {
      const provider = new MockPayoutProvider();
      const validRes = await provider.verifyAccount({
        accountType: 'bank_account',
        accountNumber: '123456789012',
        ifscCode: 'HDFC0001234',
        beneficiaryName: 'Priya Patel',
      });
      expect(validRes.verified).toBe(true);
      expect(validRes.accountNumberMasked).toBe('********9012');
      expect(validRes.providerToken).toMatch(/^mock_payout_tok_bank_/);

      const invalidIfsc = await provider.verifyAccount({
        accountType: 'bank_account',
        accountNumber: '123456789012',
        ifscCode: 'INVALID_IFSC',
        beneficiaryName: 'Priya Patel',
      });
      expect(invalidIfsc.verified).toBe(false);
      expect(invalidIfsc.error).toContain('Invalid IFSC');
    });

    it('settles payout via MockPayoutProvider', async () => {
      const provider = new MockPayoutProvider();
      const res = await provider.settlePayout({
        driverId: 'drv-123',
        payoutAccountId: 'acc-123',
        amount: 2500.5,
      });
      expect(res.status).toBe('settled');
      expect(res.payoutId).toMatch(/^payout_mock_settle_/);

      const invalidRes = await provider.settlePayout({
        driverId: 'drv-123',
        payoutAccountId: 'acc-123',
        amount: 0,
      });
      expect(invalidRes.status).toBe('failed');
    });
  });

  describe('SMS Provider & Phone Validation', () => {
    it('validates Indian E.164 phone numbers (+91)', () => {
      expect(isValidIndianPhone('+919876543210')).toBe(true);
      expect(isValidIndianPhone('+917012345678')).toBe(true);
      expect(isValidIndianPhone('+916123456789')).toBe(true);

      expect(isValidIndianPhone('9876543210')).toBe(false); // Missing +91
      expect(isValidIndianPhone('+915876543210')).toBe(false); // First digit must be 6-9
      expect(isValidIndianPhone('+19876543210')).toBe(false); // Non-India country code
    });

    it('dispatches mock SMS to valid recipients', async () => {
      const smsProvider = new MockSmsProvider();
      const res = await smsProvider.sendSms({
        to: '+919876543210',
        message: 'EMERGENCY: Driver triggered SOS at Koramangala.',
      });
      expect(res.status).toBe('sent');
      expect(res.messageId).toMatch(/^sms_mock_/);
      expect(smsProvider.getDispatches()).toHaveLength(1);
    });

    it('rejects SMS to invalid phone numbers', async () => {
      const smsProvider = new MockSmsProvider();
      const res = await smsProvider.sendSms({
        to: '09876543210',
        message: 'Test message',
      });
      expect(res.status).toBe('failed');
      expect(res.error).toContain('Invalid Indian phone number');
    });
  });

  describe('Push Notification Service & Templates', () => {
    let pushService: PushNotificationService;

    beforeEach(() => {
      pushService = new PushNotificationService(true);
    });

    it('validates Expo Push Token format', () => {
      expect(isExpoPushToken('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]')).toBe(true);
      expect(isExpoPushToken('ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]')).toBe(true);
      expect(isExpoPushToken('random-invalid-token')).toBe(false);
    });

    it('builds new_offer push message with high priority and offer metadata', () => {
      const msg = buildPushMessage('new_offer', 'ExponentPushToken[abc]', {
        assignmentId: 'asg-100',
        pickupAddress: 'Indiranagar 100ft Rd',
        estimatedFare: 350,
      });
      expect(msg.priority).toBe('high');
      expect(msg.sound).toBe('default');
      expect(msg.channelId).toBe('offers');
      expect(msg.data).toEqual({ type: 'OFFER', assignmentId: 'asg-100' });
      expect(msg.body).toContain('Indiranagar 100ft Rd');
    });

    it('builds trip_event push message', () => {
      const msg = buildPushMessage('trip_event', 'ExponentPushToken[abc]', {
        tripId: 'trip-100',
        event: 'cancelled_by_customer',
        message: 'Customer cancelled the booking.',
      });
      expect(msg.priority).toBe('high');
      expect(msg.data).toEqual({ type: 'TRIP', tripId: 'trip-100' });
    });

    it('builds driver_approval push message', () => {
      const msg = buildPushMessage('driver_approval', 'ExponentPushToken[abc]', {
        status: 'approved',
      });
      expect(msg.title).toContain('Approved');
      expect(msg.data).toEqual({ type: 'PROFILE', status: 'approved' });
    });

    it('builds settlement push message', () => {
      const msg = buildPushMessage('settlement', 'ExponentPushToken[abc]', {
        amount: 8450.5,
        period: 'Oct 12 - Oct 18',
      });
      expect(msg.title).toContain('Payout Settled');
      expect(msg.body).toContain('8450.50');
      expect(msg.data).toEqual({ type: 'EARNINGS' });
    });

    it('sends push messages, collecting successful and invalid tokens', async () => {
      const res = await pushService.sendPush([
        {
          to: 'ExponentPushToken[valid-token]',
          title: 'Hello',
          body: 'World',
        },
        {
          to: 'invalid-non-expo-token',
          title: 'Hello',
          body: 'World',
        },
      ]);

      expect(res.successfulTokens).toContain('ExponentPushToken[valid-token]');
      expect(res.invalidTokens).toContain('invalid-non-expo-token');
      expect(pushService.getSentMessages()).toHaveLength(2);
    });
  });
});
