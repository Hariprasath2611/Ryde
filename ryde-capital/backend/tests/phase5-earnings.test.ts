import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';
import { earningsService } from '../src/modules/earnings/service.js';
import { settlePendingEarningsJob } from '../src/jobs/settlePendingEarningsJob.js';

describe('Phase 5: Driver Earnings, Payout Accounts & Settlement', () => {
  const driverUserId = '22222222-2222-2222-2222-222222222222';
  const driverId = '33333333-3333-3333-3333-333333333333';
  const authHeader = { Authorization: 'Bearer valid-driver-jwt' };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(supabaseServiceClient.auth, 'getUser').mockResolvedValue({
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user: {
          id: driverUserId,
          email: 'driver@ryde.in',
          user_metadata: { role: 'driver' },
        } as any,
      },
      error: null,
    });
  });

  describe('GET /api/v1/earnings/summary', () => {
    it('returns today, this week, and this month totals plus trip count', async () => {
      vi.spyOn(earningsService, 'getEarningsSummary').mockResolvedValueOnce({
        today: 1250.5,
        thisWeek: 7800,
        thisMonth: 28400,
        completedTripsCount: 24,
      });

      const res = await request(app).get('/api/v1/earnings/summary').set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        today: 1250.5,
        thisWeek: 7800,
        thisMonth: 28400,
        completedTripsCount: 24,
      });
    });
  });

  describe('GET /api/v1/earnings', () => {
    it('returns paginated earnings breakdown for the driver', async () => {
      vi.spyOn(earningsService, 'getEarningsList').mockResolvedValueOnce({
        earnings: [
          {
            id: 'earn-1',
            driver_id: driverId,
            trip_id: 'trip-1',
            gross_amount: 350,
            platform_fee: 52.5,
            net_amount: 297.5,
            settlement_status: 'pending',
            created_at: new Date().toISOString(),
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });

      const res = await request(app).get('/api/v1/earnings?page=1&limit=10').set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.earnings).toHaveLength(1);
      expect(res.body.earnings[0].net_amount).toBe(297.5);
      expect(res.body.pagination.total).toBe(1);
    });
  });

  describe('Payout Accounts CRUD', () => {
    it('validates and creates a UPI payout account with masking', async () => {
      vi.spyOn(earningsService, 'createPayoutAccount').mockResolvedValueOnce({
        id: 'payout-acc-1',
        driver_id: driverId,
        account_type: 'upi',
        upi_id: 'd***@okhdfcbank',
        bank_name: null,
        account_number_masked: null,
        ifsc_code: null,
        beneficiary_name: 'Driver Kumar',
        provider_token: 'tok_mock_upi_123',
        is_default: true,
        verification_status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/v1/earnings/payout-accounts')
        .set(authHeader)
        .send({
          accountType: 'upi',
          upiId: 'driver@okhdfcbank',
          beneficiaryName: 'Driver Kumar',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.account_type).toBe('upi');
      expect(res.body.data.upi_id).toBe('d***@okhdfcbank');
      expect(res.body.data.is_default).toBe(true);
    });

    it('validates and creates a bank account with IFSC code and masking', async () => {
      vi.spyOn(earningsService, 'createPayoutAccount').mockResolvedValueOnce({
        id: 'payout-acc-2',
        driver_id: driverId,
        account_type: 'bank_account',
        upi_id: null,
        bank_name: 'HDFC Bank',
        account_number_masked: 'XXXX-XXXX-1234',
        ifsc_code: 'HDFC0001234',
        beneficiary_name: 'Driver Kumar',
        provider_token: 'tok_mock_bank_123',
        is_default: false,
        verification_status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/v1/earnings/payout-accounts')
        .set(authHeader)
        .send({
          accountType: 'bank_account',
          accountNumber: '987654321234',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          beneficiaryName: 'Driver Kumar',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.account_number_masked).toBe('XXXX-XXXX-1234');
      expect(res.body.data.ifsc_code).toBe('HDFC0001234');
    });

    it('rejects invalid payout account inputs missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/earnings/payout-accounts')
        .set(authHeader)
        .send({
          accountType: 'upi',
          // missing upiId
          beneficiaryName: 'Driver Kumar',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('sets a default payout account', async () => {
      const accountId = '44444444-4444-4444-4444-444444444444';
      vi.spyOn(earningsService, 'setDefaultPayoutAccount').mockResolvedValueOnce({
        success: true,
        message: 'Default payout account updated',
      });

      const res = await request(app)
        .patch(`/api/v1/earnings/payout-accounts/${accountId}/default`)
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('deletes a payout account', async () => {
      const accountId = '44444444-4444-4444-4444-444444444444';
      vi.spyOn(earningsService, 'deletePayoutAccount').mockResolvedValueOnce({
        success: true,
        message: 'Payout account removed',
      });

      const res = await request(app)
        .delete(`/api/v1/earnings/payout-accounts/${accountId}`)
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Weekly Settlement Background Job', () => {
    it('marks pending earnings as settled via mock payout provider without moving real money', async () => {
      vi.spyOn(earningsService, 'settleWeeklyEarnings').mockResolvedValueOnce([
        {
          driverId: 'drv-1',
          amount: 5400,
          payoutId: 'payout_settle_mock_123',
          status: 'settled',
        },
      ]);

      const result = await settlePendingEarningsJob();
      expect(result.settledCount).toBe(1);
      expect(result.totalAmount).toBe(5400);
    });
  });
});
