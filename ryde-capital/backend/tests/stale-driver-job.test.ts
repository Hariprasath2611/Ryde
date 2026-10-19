import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkStaleDriversJob } from '../src/jobs/staleDriverCheck.js';
import { supabaseServiceClient } from '../src/config/supabase.js';

describe('Stale Driver Offline Job (Task 1: checkStaleDriversJob)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('marks drivers with no update for 2 minutes as offline', async () => {
    const staleTime = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const freshTime = new Date(Date.now() - 30 * 1000).toISOString();

    const mockOnlineDrivers = [
      { id: 'drv-stale-1', user_id: 'usr-1' },
      { id: 'drv-fresh-2', user_id: 'usr-2' },
    ];

    const mockLocations = [
      { driver_id: 'drv-stale-1', updated_at: staleTime },
      { driver_id: 'drv-fresh-2', updated_at: freshTime },
    ];

    let updatedOfflineIds: string[] = [];

    vi.spyOn(supabaseServiceClient, 'rpc').mockResolvedValue({ data: null, error: new Error('RPC not found') } as any);

    vi.spyOn(supabaseServiceClient, 'from').mockImplementation(((table: string) => {
      if (table === 'drivers') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockOnlineDrivers, error: null }),
          update: vi.fn().mockImplementation((payload) => {
            return {
              in: vi.fn().mockImplementation((col, ids) => {
                updatedOfflineIds = ids;
                return Promise.resolve({ error: null });
              }),
            };
          }),
        };
      }
      if (table === 'driver_locations') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: mockLocations, error: null }),
        };
      }
      if (table === 'trips') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockImplementation((col) => {
            if (col === 'trip_status') {
              return Promise.resolve({ data: [], error: null }); // No active trips
            }
            return {
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
          }),
        };
      }
      return {} as any;
    }) as any);

    const result = await checkStaleDriversJob(2 * 60 * 1000);

    expect(result.offlineCount).toBe(1);
    expect(result.affectedDriverIds).toContain('drv-stale-1');
    expect(result.affectedDriverIds).not.toContain('drv-fresh-2');
  });

  it('does NOT set drivers on active trips offline even if location update is older than 2 minutes', async () => {
    const staleTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const mockOnlineDrivers = [{ id: 'drv-on-trip', user_id: 'usr-trip' }];
    const mockLocations = [{ driver_id: 'drv-on-trip', updated_at: staleTime }];

    vi.spyOn(supabaseServiceClient, 'rpc').mockResolvedValue({ data: null, error: new Error('RPC not found') } as any);

    vi.spyOn(supabaseServiceClient, 'from').mockImplementation(((table: string) => {
      if (table === 'drivers') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockOnlineDrivers, error: null }),
        };
      }
      if (table === 'driver_locations') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: mockLocations, error: null }),
        };
      }
      if (table === 'trips') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockImplementation((col) => {
            if (col === 'trip_status') {
              // Active trip found for this driver!
              return Promise.resolve({ data: [{ driver_id: 'drv-on-trip' }], error: null });
            }
            return {
              in: vi.fn().mockResolvedValue({ data: [{ driver_id: 'drv-on-trip' }], error: null }),
            };
          }),
        };
      }
      return {} as any;
    }) as any);

    const result = await checkStaleDriversJob(2 * 60 * 1000);

    expect(result.offlineCount).toBe(0);
    expect(result.affectedDriverIds).toHaveLength(0);
  });
});
