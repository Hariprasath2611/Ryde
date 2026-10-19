// ryde-capital/backend/tests/telemetry-pruning-job.test.ts
// Unit test for Phase 6 telemetry retention pruning background job

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pruneTelemetryJob } from '../src/jobs/telemetryPruningJob.js';
import { supabaseServiceClient } from '../src/config/supabase.js';

describe('Phase 6: Telemetry Retention Pruning Job', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully executes prune_stale_telemetry RPC and returns counts', async () => {
    vi.spyOn(supabaseServiceClient, 'rpc').mockResolvedValueOnce({
      data: [{ pruned_trip_locations: 150, pruned_driver_locations: 42 }],
      error: null,
    } as any);

    const result = await pruneTelemetryJob(30);

    expect(result.success).toBe(true);
    expect(result.prunedTripLocations).toBe(150);
    expect(result.prunedDriverLocations).toBe(42);
    expect(result.cutoffDate).toBeDefined();
  });

  it('falls back to direct table deletes if RPC is unavailable', async () => {
    vi.spyOn(supabaseServiceClient, 'rpc').mockResolvedValueOnce({
      data: null,
      error: { message: 'function prune_stale_telemetry does not exist' } as any,
    } as any);

    vi.spyOn(supabaseServiceClient, 'from').mockImplementation((table: string) => {
      if (table === 'trip_locations') {
        return {
          delete: vi.fn().mockReturnValue({
            lt: vi.fn().mockResolvedValue({ count: 88, error: null }),
          }),
        } as any;
      }
      if (table === 'driver_locations') {
        return {
          delete: vi.fn().mockReturnValue({
            lt: vi.fn().mockResolvedValue({ count: 12, error: null }),
          }),
        } as any;
      }
      return {} as any;
    });

    const result = await pruneTelemetryJob(30);

    expect(result.success).toBe(true);
    expect(result.prunedTripLocations).toBe(88);
    expect(result.prunedDriverLocations).toBe(12);
  });
});
