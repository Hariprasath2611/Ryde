import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MatchingWorker } from '../src/modules/matching/worker.js';
import { supabaseServiceClient } from '../src/config/supabase.js';

describe('Matching Engine Worker (Task 3: modules/matching)', () => {
  let worker: MatchingWorker;

  beforeEach(() => {
    vi.restoreAllMocks();
    worker = new MatchingWorker({
      offerTimeoutSeconds: 20,
      radiusStepsMeters: [3000, 5000, 8000],
      maxDriverAttempts: 3,
    });
  });

  it('expires stale offers whose expires_at is past', async () => {
    const expiredMockOffers = [
      { id: 'offer-1', driver_id: 'drv-1', booking_id: 'bk-1' },
      { id: 'offer-2', driver_id: 'drv-2', booking_id: 'bk-2' },
    ];

    vi.spyOn(supabaseServiceClient, 'from').mockImplementation(((table: string) => {
      if (table === 'driver_assignments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({ data: expiredMockOffers, error: null }),
          update: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {} as any;
    }) as any);

    const count = await worker.expireStaleOffers();
    expect(count).toBe(2);
  });

  it('selects nearest eligible driver and creates assignment offer', async () => {
    const searchingBooking = {
      id: 'bk-100',
      vehicle_id: 'veh-100',
      pickup_location: 'POINT(77.5946 12.9716)',
      pickup_address: 'Bangalore Center',
      created_at: new Date().toISOString(),
    };

    const mockCandidates = [
      { driver_id: 'drv-near', distance_m: 800 },
      { driver_id: 'drv-far', distance_m: 2200 },
    ];

    vi.spyOn(worker, 'findCandidates').mockResolvedValue(mockCandidates);

    let createdAssignment: any = null;

    vi.spyOn(supabaseServiceClient, 'from').mockImplementation(((table: string) => {
      if (table === 'bookings') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [searchingBooking], error: null }),
        };
      }
      if (table === 'driver_assignments') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gt: vi.fn().mockResolvedValue({ data: [], error: null }), // No active offer currently
          insert: vi.fn().mockImplementation((payload) => {
            createdAssignment = payload;
            return Promise.resolve({ error: null });
          }),
        };
      }
      if (table === 'vehicles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { vehicle_type: 'four_wheeler' }, error: null }),
        };
      }
      if (table === 'driver_locations') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { location: 'POINT(77.5950 12.9720)' },
            error: null,
          }),
        };
      }
      return {} as any;
    }) as any);

    const result = await worker.processSearchingBookings();

    expect(result.offersCreated).toBe(1);
    expect(createdAssignment).toBeDefined();
    expect(createdAssignment.driver_id).toBe('drv-near'); // Nearest driver picked!
    expect(createdAssignment.booking_id).toBe('bk-100');
    expect(createdAssignment.assignment_status).toBe('offered');
  });

  it('marks booking as no_driver_found when max attempts or widening radius exhausted', async () => {
    const searchingBooking = {
      id: 'bk-200',
      vehicle_id: 'veh-200',
      pickup_location: 'POINT(77.5946 12.9716)',
      pickup_address: 'Bangalore Center',
      created_at: new Date().toISOString(),
    };

    // No candidates found in any radius
    vi.spyOn(worker, 'findCandidates').mockResolvedValue([]);

    let updatedStatus: string | null = null;

    vi.spyOn(supabaseServiceClient, 'from').mockImplementation(((table: string) => {
      if (table === 'bookings') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [searchingBooking], error: null }),
          update: vi.fn().mockImplementation((payload) => {
            updatedStatus = payload.booking_status;
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        };
      }
      if (table === 'driver_assignments') {
        const queryBuilder: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gt: vi.fn().mockResolvedValue({ data: [], error: null }),
          then: (resolve: any) =>
            resolve({
              data: [{ driver_id: 'drv-1' }, { driver_id: 'drv-2' }, { driver_id: 'drv-3' }],
              error: null,
            }),
        };
        return queryBuilder;
      }
      if (table === 'vehicles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { vehicle_type: 'four_wheeler' }, error: null }),
        };
      }
      return {} as any;
    }) as any);

    const result = await worker.processSearchingBookings();

    expect(result.noDriverFoundCount).toBe(1);
    expect(updatedStatus).toBe('no_driver_found');
  });
});
