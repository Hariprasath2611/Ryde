// ryde-capital/backend/tests/integration-matching-simulation.test.ts
// End-to-end integration test: Simulator creates booking -> Matching Worker dispatches offer -> Driver accepts -> Trip created

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';
import { MatchingWorker } from '../src/modules/matching/worker.js';

describe('End-to-End Integration: Simulator Booking to Driver Assignment Acceptance', () => {
  const testDriverUserId = '00000000-0000-0000-0000-000000000002';
  const testDriverId = '10000000-0000-0000-0000-000000000001';
  const testCustomerId = '20000000-0000-0000-0000-000000000001';
  const testVehicleId = '30000000-0000-0000-0000-000000000001';
  const testBookingId = '40000000-0000-0000-0000-000000000099';
  const testAssignmentId = '50000000-0000-0000-0000-000000000099';

  const authHeader = { Authorization: 'Bearer valid-test-token' };

  let simulatedBooking: any = null;
  let dispatchedAssignment: any = null;
  let createdTrip: any = null;
  let driverAvailability: string = 'online';

  beforeEach(() => {
    vi.restoreAllMocks();

    simulatedBooking = {
      id: testBookingId,
      customer_id: testCustomerId,
      vehicle_id: testVehicleId,
      pickup_location: 'POINT(77.5946 12.9716)',
      pickup_address: 'Brigade Road, Bangalore',
      destination_location: 'POINT(77.6408 12.9784)',
      destination_address: '100ft Rd, Indiranagar',
      booking_status: 'searching',
      estimated_fare: 350.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dispatchedAssignment = null;
    createdTrip = null;
    driverAvailability = 'online';

    // Mock driver auth session
    vi.spyOn(supabaseServiceClient.auth, 'getUser').mockResolvedValue({
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user: {
          id: testDriverUserId,
          email: 'driver@ryde.in',
          user_metadata: { role: 'driver' },
        } as any,
      },
      error: null,
    });

    // Mock Supabase data layer
    vi.spyOn(supabaseServiceClient, 'from').mockImplementation(((table: string) => {
      if (table === 'bookings') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((col: string, val: string) => {
            if (col === 'id') {
              return {
                maybeSingle: vi.fn().mockResolvedValue({ data: simulatedBooking, error: null }),
              };
            }
            if (col === 'booking_status') {
              return {
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                  data: simulatedBooking.booking_status === 'searching' ? [simulatedBooking] : [],
                  error: null,
                }),
              };
            }
            return {
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({ data: [simulatedBooking], error: null }),
            };
          }),
          update: vi.fn().mockImplementation((payload) => {
            Object.assign(simulatedBooking, payload);
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        };
      }

      if (table === 'vehicles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: testVehicleId, vehicle_type: 'four_wheeler' },
            error: null,
          }),
        };
      }

      if (table === 'drivers') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: testDriverId,
              user_id: testDriverUserId,
              driver_code: 'DRV-1001',
              verification_status: 'approved',
              onboarding_status: 'approved',
              availability_status: driverAvailability,
              allowed_vehicle_types: ['four_wheeler'],
              rating_avg: 4.9,
            },
            error: null,
          }),
          update: vi.fn().mockImplementation((payload) => {
            if (payload.availability_status) {
              driverAvailability = payload.availability_status;
            }
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        };
      }

      if (table === 'driver_locations') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [
              {
                driver_id: testDriverId,
                location: 'POINT(77.5950 12.9720)',
                updated_at: new Date().toISOString(),
              },
            ],
            error: null,
          }),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              driver_id: testDriverId,
              location: 'POINT(77.5950 12.9720)',
              updated_at: new Date().toISOString(),
            },
            error: null,
          }),
        };
      }

      if (table === 'driver_assignments') {
        const queryBuilder: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((col: string, val: string) => {
            if (col === 'driver_id') {
              return {
                eq: vi.fn().mockImplementation((col2: string, val2: string) => {
                  if (col2 === 'assignment_status' && val2 === 'offered') {
                    return {
                      gt: vi.fn().mockReturnThis(),
                      order: vi.fn().mockReturnThis(),
                      limit: vi.fn().mockReturnThis(),
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: dispatchedAssignment?.assignment_status === 'offered' ? dispatchedAssignment : null,
                        error: null,
                      }),
                    };
                  }
                  return queryBuilder;
                }),
                order: vi.fn().mockReturnThis(),
                range: vi.fn().mockResolvedValue({
                  data: dispatchedAssignment ? [dispatchedAssignment] : [],
                  error: null,
                }),
              };
            }
            return queryBuilder;
          }),
          lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          gt: vi.fn().mockResolvedValue({
            data: dispatchedAssignment?.assignment_status === 'offered' ? [dispatchedAssignment] : [],
            error: null,
          }),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: dispatchedAssignment ? [dispatchedAssignment] : [],
            error: null,
          }),
          maybeSingle: vi.fn().mockImplementation(() =>
            Promise.resolve({ data: dispatchedAssignment, error: null }),
          ),
          insert: vi.fn().mockImplementation((payload) => {
            dispatchedAssignment = {
              id: testAssignmentId,
              ...payload,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            return Promise.resolve({ error: null });
          }),
          update: vi.fn().mockImplementation((payload) => {
            return {
              eq: vi.fn().mockImplementation((col: string, val: string) => {
                if (col === 'id' && val === testAssignmentId && dispatchedAssignment) {
                  Object.assign(dispatchedAssignment, payload);
                }
                return {
                  neq: vi.fn().mockReturnThis(),
                  eq: vi.fn().mockReturnThis(),
                  select: vi.fn().mockReturnThis(),
                  single: vi.fn().mockResolvedValue({ data: dispatchedAssignment, error: null }),
                };
              }),
              neq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: dispatchedAssignment, error: null }),
            };
          }),
        };
        return queryBuilder;
      }

      if (table === 'trips') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: createdTrip ? [createdTrip] : [], error: null }),
          insert: vi.fn().mockImplementation((payload) => {
            createdTrip = {
              id: '70000000-0000-0000-0000-000000000001',
              ...payload,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: createdTrip, error: null }),
            };
          }),
        };
      }

      return {} as any;
    }) as any);
  });

  it('runs end-to-end: matching worker picks up simulated booking, driver receives offer, and accepts into trip', async () => {
    // 1. Initial State: simulated booking is searching
    expect(simulatedBooking.booking_status).toBe('searching');

    // 2. Matching Worker executes one cycle
    const worker = new MatchingWorker({ offerTimeoutSeconds: 20 });
    // Mock candidate search to return our test driver
    vi.spyOn(worker, 'findCandidates').mockResolvedValue([
      { driver_id: testDriverId, distance_m: 650 },
    ]);

    const cycleResult = await worker.runCycle();
    expect(cycleResult.offersCreated).toBe(1);
    expect(dispatchedAssignment).toBeDefined();
    expect(dispatchedAssignment.assignment_status).toBe('offered');
    expect(dispatchedAssignment.driver_id).toBe(testDriverId);

    // 3. Driver App polls /api/v1/assignments and receives offer
    const pollRes = await request(app).get('/api/v1/assignments').set(authHeader);
    expect(pollRes.status).toBe(200);
    expect(pollRes.body.data.activeOffer).toBeDefined();
    expect(pollRes.body.data.activeOffer.id).toBe(testAssignmentId);
    expect(pollRes.body.data.activeOffer.booking.pickup_address).toBe('Brigade Road, Bangalore');
    expect(pollRes.body.data.activeOffer.booking.estimated_fare).toBe(350.0);
    // Crucial check: customer phone number is NOT exposed
    expect(pollRes.body.data.activeOffer.booking.customer_phone).toBeUndefined();

    // 4. Driver App calls route preview
    const routeRes = await request(app)
      .get(`/api/v1/assignments/${testAssignmentId}/route`)
      .set(authHeader);
    expect(routeRes.status).toBe(200);
    expect(routeRes.body.data.polyline).toBeDefined();
    expect(routeRes.body.data.pickupAddress).toBe('Brigade Road, Bangalore');

    // 5. Driver accepts the offer
    const acceptRes = await request(app)
      .post(`/api/v1/assignments/${testAssignmentId}/accept`)
      .set(authHeader);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe('accepted');
    expect(acceptRes.body.data.tripId).toBeDefined();

    // 6. Verify end states
    expect(dispatchedAssignment.assignment_status).toBe('accepted');
    expect(simulatedBooking.booking_status).toBe('assigned');
    expect(createdTrip).toBeDefined();
    expect(createdTrip.trip_status).toBe('assigned');
    expect(driverAvailability).toBe('on_trip');
  });
});
