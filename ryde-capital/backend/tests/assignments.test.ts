import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';
import { assignmentsRepository } from '../src/modules/assignments/repository.js';

describe('Assignments and Ride Offers (Task 3)', () => {
  const driverUserId = '22222222-2222-2222-2222-222222222222';
  const driverId = '33333333-3333-3333-3333-333333333333';
  const assignmentId = '55555555-5555-5555-5555-555555555555';
  const bookingId = '66666666-6666-6666-6666-666666666666';
  const authHeader = { Authorization: 'Bearer valid-driver-token' };

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

    vi.spyOn(assignmentsRepository, 'getDriverByUserId').mockResolvedValue({
      id: driverId,
      user_id: driverUserId,
      driver_code: 'DRV-TEST',
      verification_status: 'approved',
      onboarding_status: 'approved',
      availability_status: 'online',
      allowed_vehicle_types: ['four_wheeler'],
      rating_avg: 5.0,
      rating_count: 0,
      experience_years: 3,
      date_of_birth: null,
      address_line: null,
      city: null,
      state: null,
      pincode: null,
      profile_photo_path: null,
      rejection_reason: null,
      submitted_at: null,
      approved_by: null,
      approved_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  describe('GET /api/v1/assignments', () => {
    it('returns active offer without customer phone number', async () => {
      vi.spyOn(assignmentsRepository, 'getActiveOffer').mockResolvedValue({
        id: assignmentId,
        booking_id: bookingId,
        driver_id: driverId,
        distance_to_customer_m: 1250,
        estimated_arrival_s: 300,
        assignment_status: 'offered',
        rejection_reason: null,
        expires_at: new Date(Date.now() + 18000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        booking: {
          id: bookingId,
          pickup_address: 'Indiranagar 100ft Rd',
          pickup_location: 'POINT(77.6408 12.9784)',
          destination_address: 'Koramangala 5th Block',
          destination_location: 'POINT(77.6190 12.9352)',
          estimated_fare: 450.0,
          booking_status: 'searching',
          vehicle_type: 'four_wheeler',
        },
      });

      vi.spyOn(assignmentsRepository, 'listAssignments').mockResolvedValue([]);

      const res = await request(app).get('/api/v1/assignments').set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.activeOffer).toBeDefined();
      expect(res.body.data.activeOffer.id).toBe(assignmentId);
      expect(res.body.data.activeOffer.distance_to_customer_m).toBe(1250);
      expect(res.body.data.activeOffer.booking.pickup_address).toBe('Indiranagar 100ft Rd');
      // Crucial: Phone number must not be present
      expect(res.body.data.activeOffer.booking.customer_phone).toBeUndefined();
      expect(res.body.data.activeOffer.customer_phone).toBeUndefined();
    });
  });

  describe('GET /api/v1/assignments/:id/route', () => {
    it('returns polyline and route preview for the offer modal', async () => {
      vi.spyOn(assignmentsRepository, 'getAssignmentById').mockResolvedValue({
        id: assignmentId,
        booking_id: bookingId,
        driver_id: driverId,
        distance_to_customer_m: 1200,
        estimated_arrival_s: 300,
        assignment_status: 'offered',
        rejection_reason: null,
        expires_at: new Date(Date.now() + 15000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(assignmentsRepository, 'getBookingWithVehicle').mockResolvedValue({
        id: bookingId,
        customer_id: 'cust-123',
        vehicle_id: 'veh-123',
        pickup_address: 'MG Road Metro',
        pickup_location: 'POINT(77.6074 12.9754)',
        destination_address: 'Whitefield Main Rd',
        destination_location: 'POINT(77.7499 12.9698)',
        estimated_fare: 550,
        booking_status: 'searching',
        scheduled_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        vehicle_type: 'four_wheeler',
      });

      const res = await request(app)
        .get(`/api/v1/assignments/${assignmentId}/route`)
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.polyline).toBeDefined();
      expect(res.body.data.pickupAddress).toBe('MG Road Metro');
      expect(res.body.data.destinationAddress).toBe('Whitefield Main Rd');
      expect(res.body.data.distanceMeters).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/assignments/:id/accept', () => {
    it('successfully accepts assignment atomically and creates trip', async () => {
      const tripId = '77777777-7777-7777-7777-777777777777';
      vi.spyOn(assignmentsRepository, 'acceptAssignment').mockResolvedValue({
        status: 'accepted',
        trip_id: tripId,
        booking_id: bookingId,
      });

      const res = await request(app)
        .post(`/api/v1/assignments/${assignmentId}/accept`)
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('accepted');
      expect(res.body.data.tripId).toBe(tripId);
    });

    it('returns 409 Conflict when race condition occurs (another driver accepted first)', async () => {
      vi.spyOn(assignmentsRepository, 'acceptAssignment').mockRejectedValue(
        new Error('BOOKING_ALREADY_ASSIGNED'),
      );

      const res = await request(app)
        .post(`/api/v1/assignments/${assignmentId}/accept`)
        .set(authHeader);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain('already assigned');
    });

    it('returns 409 Conflict when offer has expired', async () => {
      vi.spyOn(assignmentsRepository, 'acceptAssignment').mockRejectedValue(
        new Error('ASSIGNMENT_EXPIRED'),
      );

      const res = await request(app)
        .post(`/api/v1/assignments/${assignmentId}/accept`)
        .set(authHeader);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain('expired');
    });
  });

  describe('POST /api/v1/assignments/:id/reject', () => {
    it('marks assignment rejected with reason', async () => {
      vi.spyOn(assignmentsRepository, 'rejectAssignment').mockResolvedValue({
        id: assignmentId,
        booking_id: bookingId,
        driver_id: driverId,
        distance_to_customer_m: 1200,
        estimated_arrival_s: 300,
        assignment_status: 'rejected',
        rejection_reason: 'Too far away',
        expires_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post(`/api/v1/assignments/${assignmentId}/reject`)
        .set(authHeader)
        .send({ reason: 'Too far away' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('rejected');
      expect(res.body.data.assignmentId).toBe(assignmentId);
    });
  });
});
