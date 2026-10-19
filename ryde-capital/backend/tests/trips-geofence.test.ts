import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';
import { tripsRepository } from '../src/modules/trips/repository.js';
import type { TripRow, TripDetailed, DriverRow } from '../src/modules/trips/repository.js';
import type { FareRule } from '@ryde/shared';

describe('Phase 4: Trip Geofence & Handover Verification Tests', () => {
  const driverUserId = '44444444-4444-4444-4444-444444444444';
  const driverId = '55555555-5555-5555-5555-555555555555';
  const tripId = '66666666-6666-6666-6666-666666666666';
  const authHeader = { Authorization: 'Bearer valid-driver-token' };

  const mockDriver: DriverRow = {
    id: driverId,
    user_id: driverUserId,
    driver_code: 'DRV-PH4',
    verification_status: 'approved',
    onboarding_status: 'approved',
    availability_status: 'on_trip',
    allowed_vehicle_types: ['four_wheeler'],
    rating_avg: 5.0,
    rating_count: 10,
    experience_years: 5,
    date_of_birth: '1990-01-01',
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
  };

  const mockFareRule: FareRule = {
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

    vi.spyOn(tripsRepository, 'getDriverByUserId').mockResolvedValue(mockDriver);
    vi.spyOn(tripsRepository, 'getFareRule').mockResolvedValue(mockFareRule);
    vi.spyOn(tripsRepository, 'recordTripFareAndPayment').mockResolvedValue();
    vi.spyOn(tripsRepository, 'updateVehicleHandoverReturn').mockResolvedValue();
    vi.spyOn(tripsRepository, 'getTripBreadcrumbs').mockResolvedValue([]);
  });

  describe('Pickup Geofence (POST /trips/:id/arrived)', () => {
    const tripHeading: TripRow = {
      id: tripId,
      booking_id: '77777777-7777-7777-7777-777777777777',
      customer_id: '88888888-8888-8888-8888-888888888888',
      driver_id: driverId,
      vehicle_id: '99999999-9999-9999-9999-999999999999',
      trip_status: 'heading_to_pickup',
      distance_m: null,
      duration_s: null,
      final_fare: null,
      started_at: null,
      ended_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('rejects arrival when driver is > 150m from pickup (400 Bad Request)', async () => {
      vi.spyOn(tripsRepository, 'getTripById').mockResolvedValue(tripHeading);
      vi.spyOn(tripsRepository, 'getTripForUpdate').mockResolvedValue(tripHeading);
      vi.spyOn(tripsRepository, 'getTripDetails').mockResolvedValue({
        ...tripHeading,
        booking: {
          id: '77777777-7777-7777-7777-777777777777',
          pickup_address: 'Koramangala',
          pickup_location: { coordinates: [77.6200, 12.9300] },
          destination_address: 'Indiranagar',
          destination_location: { coordinates: [77.6400, 12.9700] },
          estimated_fare: 200,
          booking_status: 'driver_assigned',
        },
      } as TripDetailed);

      // Driver is 500m away
      vi.spyOn(tripsRepository, 'getDriverLatestLocation').mockResolvedValue({
        latitude: 12.9345,
        longitude: 77.6200, // ~500 meters away
        recorded_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/arrived`)
        .set(authHeader);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('away from pickup location');
      expect(res.body.error.message).toContain('within 150m');
    });

    it('allows arrival when driver is within 150m of pickup', async () => {
      vi.spyOn(tripsRepository, 'getTripById').mockResolvedValue(tripHeading);
      vi.spyOn(tripsRepository, 'getTripForUpdate').mockResolvedValue(tripHeading);
      vi.spyOn(tripsRepository, 'getTripDetails').mockResolvedValue({
        ...tripHeading,
        booking: {
          id: '77777777-7777-7777-7777-777777777777',
          pickup_address: 'Koramangala',
          pickup_location: { coordinates: [77.6200, 12.9300] },
          destination_address: 'Indiranagar',
          destination_location: { coordinates: [77.6400, 12.9700] },
          estimated_fare: 200,
          booking_status: 'driver_assigned',
        },
      } as TripDetailed);

      // Driver is ~45m away
      vi.spyOn(tripsRepository, 'getDriverLatestLocation').mockResolvedValue({
        latitude: 12.9304,
        longitude: 77.6201,
        recorded_at: new Date().toISOString(),
      });

      vi.spyOn(tripsRepository, 'updateTripStatus').mockResolvedValue({
        ...tripHeading,
        trip_status: 'arrived',
      });

      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/arrived`)
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.tripStatus).toBe('arrived');
      expect(res.body.data.waitingStartedAt).toBeDefined();
    });
  });

  describe('Destination Geofence & Early Drop Audit (POST /trips/:id/end)', () => {
    const tripInProgress: TripRow = {
      id: tripId,
      booking_id: '77777777-7777-7777-7777-777777777777',
      customer_id: '88888888-8888-8888-8888-888888888888',
      driver_id: driverId,
      vehicle_id: '99999999-9999-9999-9999-999999999999',
      trip_status: 'in_progress',
      distance_m: null,
      duration_s: null,
      final_fare: null,
      started_at: new Date(Date.now() - 1200000).toISOString(),
      ended_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('requires earlyDropReason if driver ends trip > 200m from destination', async () => {
      vi.spyOn(tripsRepository, 'getTripById').mockResolvedValue(tripInProgress);
      vi.spyOn(tripsRepository, 'getTripForUpdate').mockResolvedValue(tripInProgress);
      vi.spyOn(tripsRepository, 'getTripDetails').mockResolvedValue({
        ...tripInProgress,
        booking: {
          id: '77777777-7777-7777-7777-777777777777',
          pickup_address: 'Koramangala',
          pickup_location: { coordinates: [77.6200, 12.9300] },
          destination_address: 'Indiranagar',
          destination_location: { coordinates: [77.6400, 12.9700] },
          estimated_fare: 200,
          booking_status: 'in_progress',
        },
      } as TripDetailed);

      // Driver is 800m away from destination
      vi.spyOn(tripsRepository, 'getDriverLatestLocation').mockResolvedValue({
        latitude: 12.9620,
        longitude: 77.6400,
        recorded_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/end`)
        .set(authHeader)
        .send({
          odometerAfter: 45030,
        }); // Missing earlyDropReason

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('early drop reason is required');
    });

    it('accepts trip end with earlyDropReason and flags trip for audit', async () => {
      vi.spyOn(tripsRepository, 'getTripById').mockResolvedValue(tripInProgress);
      vi.spyOn(tripsRepository, 'getTripForUpdate').mockResolvedValue(tripInProgress);
      vi.spyOn(tripsRepository, 'getTripDetails').mockResolvedValue({
        ...tripInProgress,
        booking: {
          id: '77777777-7777-7777-7777-777777777777',
          pickup_address: 'Koramangala',
          pickup_location: { coordinates: [77.6200, 12.9300] },
          destination_address: 'Indiranagar',
          destination_location: { coordinates: [77.6400, 12.9700] },
          estimated_fare: 200,
          booking_status: 'in_progress',
        },
      } as TripDetailed);

      vi.spyOn(tripsRepository, 'getDriverLatestLocation').mockResolvedValue({
        latitude: 12.9620,
        longitude: 77.6400, // 800m away
        recorded_at: new Date().toISOString(),
      });

      let flagged = false;
      let reasonAudit = '';
      vi.spyOn(tripsRepository, 'updateTripStatus').mockImplementation(async (_id, status, updates) => {
        flagged = Boolean(updates?.['flagged_for_audit']);
        reasonAudit = String(updates?.['audit_reason']);
        return { ...tripInProgress, trip_status: status as unknown as TripRow['trip_status'] };
      });

      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/end`)
        .set(authHeader)
        .send({
          odometerAfter: 45030,
          earlyDropReason: 'Customer requested drop at intermediate metro station',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.tripStatus).toBe('completed');
      expect(flagged).toBe(true);
      expect(reasonAudit).toContain('Customer requested drop');
    });
  });
});
