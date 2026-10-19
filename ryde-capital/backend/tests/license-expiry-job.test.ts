// ryde-capital/backend/tests/license-expiry-job.test.ts
// Vitest unit tests for daily license expiry check background job

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkLicenseExpiryJob } from '../src/jobs/licenseExpiryCheck.js';
import { supabaseServiceClient } from '../src/config/supabase.js';

describe('Daily License Expiry Background Job', () => {
  const testDriverId = '10000000-0000-0000-0000-000000000001';
  const testUserId = '00000000-0000-0000-0000-000000000002';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('detects drivers with expired driving licenses, flags them, sets offline, and notifies them', async () => {
    // 1. Mock expired driving licenses query
    const selectExpiredMock = vi.fn().mockReturnValue({
      lt: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'dl-expired-1',
            driver_id: testDriverId,
            expiry_date: '2020-01-01',
            verification_status: 'approved',
          },
        ],
        error: null,
      }),
    });

    // 2. Mock driver fetch query
    const selectDriverMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: testDriverId,
            user_id: testUserId,
            verification_status: 'approved',
            availability_status: 'online',
          },
        }),
      }),
    });

    // 3. Mock updates
    const updateDriverMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const updateLicenseMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    // 4. Mock notification & audit log inserts
    const insertMock = vi.fn().mockResolvedValue({ error: null });

    vi.spyOn(supabaseServiceClient, 'from').mockImplementation((table: string) => {
      if (table === 'driving_licenses') {
        return {
          select: selectExpiredMock,
          update: updateLicenseMock,
        } as any;
      }
      if (table === 'drivers') {
        return {
          select: selectDriverMock,
          update: updateDriverMock,
        } as any;
      }
      if (table === 'notifications' || table === 'audit_logs') {
        return {
          insert: insertMock,
        } as any;
      }
      return {} as any;
    });

    const result = await checkLicenseExpiryJob();

    expect(result.expiredCount).toBe(1);
    expect(result.affectedDriverIds).toContain(testDriverId);
    expect(updateDriverMock).toHaveBeenCalledWith(
      expect.objectContaining({
        verification_status: 'expired',
        availability_status: 'offline',
      }),
    );
    expect(insertMock).toHaveBeenCalled();
  });
});
