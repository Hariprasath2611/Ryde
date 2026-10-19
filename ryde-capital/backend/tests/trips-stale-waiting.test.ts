import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkStaleWaitingTripsJob } from '../src/jobs/staleWaitingTripCheck.js';
import { supabaseServiceClient } from '../src/config/supabase.js';

describe('Phase 4: Customer No-Show Stale Waiting Trip Background Job', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('cancels trips where customer was a no-show for > 10 minutes', async () => {
    const trip1 = {
      id: 'trip-111',
      driver_id: 'drv-111',
      booking_id: 'bk-111',
      waiting_started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
    };

    // Mock RPC returning empty/error so fallback executes
    vi.spyOn(supabaseServiceClient, 'rpc').mockResolvedValue({
      data: null,
      error: { message: 'RPC not available' } as unknown as null,
    });

    const updateCalls: Array<{ table: string; payload: unknown; eqField: string; eqVal: unknown }> = [];

    // Mock select & updates
    vi.spyOn(supabaseServiceClient, 'from').mockImplementation((table: string) => {
      if (table === 'trips') {
        return {
          select: () => ({
            eq: () => ({
              not: () => ({
                lte: async () => ({ data: [trip1], error: null }),
              }),
            }),
          }),
          update: (payload: unknown) => ({
            eq: (eqField: string, eqVal: unknown) => {
              updateCalls.push({ table: 'trips', payload, eqField, eqVal });
              return Promise.resolve({ error: null });
            },
          }),
        } as unknown as ReturnType<typeof supabaseServiceClient.from>;
      }

      if (table === 'drivers') {
        return {
          update: (payload: unknown) => ({
            eq: (eqField: string, eqVal: unknown) => {
              updateCalls.push({ table: 'drivers', payload, eqField, eqVal });
              return Promise.resolve({ error: null });
            },
          }),
        } as unknown as ReturnType<typeof supabaseServiceClient.from>;
      }

      if (table === 'bookings') {
        return {
          update: (payload: unknown) => ({
            eq: (eqField: string, eqVal: unknown) => {
              updateCalls.push({ table: 'bookings', payload, eqField, eqVal });
              return Promise.resolve({ error: null });
            },
          }),
        } as unknown as ReturnType<typeof supabaseServiceClient.from>;
      }

      return {} as unknown as ReturnType<typeof supabaseServiceClient.from>;
    });

    const result = await checkStaleWaitingTripsJob(10);

    expect(result.cancelledCount).toBe(1);
    expect(result.affectedTripIds).toContain('trip-111');

    // Verify trip update
    const tripUpdate = updateCalls.find((c) => c.table === 'trips');
    expect(tripUpdate).toBeDefined();
    expect((tripUpdate?.payload as { trip_status?: string }).trip_status).toBe('cancelled_by_system');

    // Verify driver reset to online
    const driverUpdate = updateCalls.find((c) => c.table === 'drivers');
    expect(driverUpdate).toBeDefined();
    expect((driverUpdate?.payload as { availability_status?: string }).availability_status).toBe('online');

    // Verify booking cancelled
    const bookingUpdate = updateCalls.find((c) => c.table === 'bookings');
    expect(bookingUpdate).toBeDefined();
    expect((bookingUpdate?.payload as { booking_status?: string }).booking_status).toBe('cancelled');
  });

  it('does nothing when no trips exceed waiting timeout', async () => {
    vi.spyOn(supabaseServiceClient, 'rpc').mockResolvedValue({
      data: null,
      error: { message: 'RPC not available' } as unknown as null,
    });

    vi.spyOn(supabaseServiceClient, 'from').mockImplementation(() => {
      return {
        select: () => ({
          eq: () => ({
            not: () => ({
              lte: async () => ({ data: [], error: null }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabaseServiceClient.from>;
    });

    const result = await checkStaleWaitingTripsJob(10);
    expect(result.cancelledCount).toBe(0);
    expect(result.affectedTripIds).toHaveLength(0);
  });
});
