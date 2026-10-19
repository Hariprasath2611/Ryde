import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';
import { tripsRepository } from '../src/modules/trips/repository.js';
import type { TripRow, TripDetailed, DriverRow } from '../src/modules/trips/repository.js';
import type { FareRule } from '@ryde/shared';

describe('Phase 4: Trips State Machine & Lifecycle Integration Tests', () => {
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
    address_line: '123 MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
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

  let currentTripStatus: string;
  let currentTrip: TripRow;

  beforeEach(() => {
    vi.restoreAllMocks();
    currentTripStatus = 'assigned';

    currentTrip = {
      id: tripId,
      booking_id: '77777777-7777-7777-7777-777777777777',
      customer_id: '88888888-8888-8888-8888-888888888888',
      driver_id: driverId,
      vehicle_id: '99999999-9999-9999-9999-999999999999',
      trip_status: 'assigned',
      distance_m: null,
      duration_s: null,
      final_fare: null,
      started_at: null,
      ended_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.spyOn(supabaseServiceClient.auth, 'getUser').mockResolvedValue({
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user: {
          id: driverUserId,
          email: 'driver4@ryde.in',
          user_metadata: { role: 'driver' },
        } as any,
      },
      error: null,
    });

    vi.spyOn(tripsRepository, 'getDriverByUserId').mockResolvedValue(mockDriver);

    vi.spyOn(tripsRepository, 'getTripById').mockImplementation(async () => {
      return { ...currentTrip, trip_status: currentTripStatus as unknown as TripRow['trip_status'] };
    });

    vi.spyOn(tripsRepository, 'getTripForUpdate').mockImplementation(async () => {
      return { ...currentTrip, trip_status: currentTripStatus as unknown as TripRow['trip_status'] };
    });

    vi.spyOn(tripsRepository, 'updateTripStatus').mockImplementation(async (_id, status, updates) => {
      currentTripStatus = status;
      currentTrip = {
        ...currentTrip,
        trip_status: status as unknown as TripRow['trip_status'],
        ...(updates || {}),
      };
      return currentTrip;
    });

    vi.spyOn(tripsRepository, 'getTripDetails').mockImplementation(async () => {
      return {
        ...currentTrip,
        trip_status: currentTripStatus,
        booking: {
          id: '77777777-7777-7777-7777-777777777777',
          pickup_address: 'Koramangala 5th Block',
          pickup_location: { coordinates: [77.62, 12.93] },
          destination_address: 'Indiranagar 100ft Rd',
          destination_location: { coordinates: [77.64, 12.97] },
          estimated_fare: 250,
          booking_status: 'driver_assigned',
        },
        vehicle: {
          id: '99999999-9999-9999-9999-999999999999',
          make: 'Hyundai',
          model: 'Creta',
          year: 2022,
          license_plate: 'KA-01-MJ-5566',
          vehicle_type: 'four_wheeler',
        },
        customer: {
          id: '88888888-8888-8888-8888-888888888888',
          full_name: 'Rahul Sharma',
          phone: '+919876543210',
        },
      } as TripDetailed;
    });

    vi.spyOn(tripsRepository, 'getDriverLatestLocation').mockResolvedValue({
      latitude: 12.9305,
      longitude: 77.6202, // ~60 meters from pickup
      recorded_at: new Date().toISOString(),
    });

    vi.spyOn(tripsRepository, 'getFareRule').mockResolvedValue(mockFareRule);
    vi.spyOn(tripsRepository, 'recordTripFareAndPayment').mockResolvedValue();
    vi.spyOn(tripsRepository, 'createVehicleHandover').mockResolvedValue('handover-123');
    vi.spyOn(tripsRepository, 'insertHandoverPhotos').mockResolvedValue();
    vi.spyOn(tripsRepository, 'updateVehicleHandoverReturn').mockResolvedValue();
    vi.spyOn(tripsRepository, 'getTripBreadcrumbs').mockResolvedValue([
      { latitude: 12.93, longitude: 77.62, speed: 20, recorded_at: new Date(Date.now() - 600000).toISOString() },
      { latitude: 12.95, longitude: 77.63, speed: 35, recorded_at: new Date(Date.now() - 300000).toISOString() },
      { latitude: 12.97, longitude: 77.64, speed: 15, recorded_at: new Date().toISOString() },
    ]);
  });

  it('progresses through the full valid lifecycle end-to-end', async () => {
    // 1. GET /trips/:id -> assigned
    const getRes = await request(app).get(`/api/v1/trips/${tripId}`).set(authHeader);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.trip_status).toBe('assigned');

    // 2. POST /trips/:id/start-heading -> heading_to_pickup
    const headingRes = await request(app)
      .post(`/api/v1/trips/${tripId}/start-heading`)
      .set(authHeader);
    expect(headingRes.status).toBe(200);
    expect(headingRes.body.data.tripStatus).toBe('heading_to_pickup');

    // 3. POST /trips/:id/arrived -> arrived (geofenced <= 150m)
    const arrivedRes = await request(app)
      .post(`/api/v1/trips/${tripId}/arrived`)
      .set(authHeader);
    expect(arrivedRes.status).toBe(200);
    expect(arrivedRes.body.data.tripStatus).toBe('arrived');

    // 4. POST /trips/:id/generate-otp & verify-otp -> otp_verified
    const testOtp = '654321';
    const dynamicHash = crypto.createHash('sha256').update(`${testOtp}:${tripId}`).digest('hex');
    vi.spyOn(tripsRepository, 'getTripOtp').mockResolvedValue({
      otp_hash: dynamicHash,
      attempts: 0,
      max_attempts: 5,
      expires_at: new Date(Date.now() + 600000).toISOString(),
      last_generated_at: new Date().toISOString(),
      locked_out_at: null,
      verified_at: null,
    });
    vi.spyOn(tripsRepository, 'markOtpVerified').mockResolvedValue();
    vi.spyOn(tripsRepository, 'incrementOtpAttempts').mockResolvedValue();

    const verifyRes = await request(app)
      .post(`/api/v1/trips/${tripId}/verify-otp`)
      .set(authHeader)
      .send({ otp: testOtp });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.tripStatus).toBe('otp_verified');

    // 5. POST /trips/:id/handover -> handover_done (all 6 mandatory photos)
    const handoverRes = await request(app)
      .post(`/api/v1/trips/${tripId}/handover`)
      .set(authHeader)
      .send({
        odometerBefore: 45020.5,
        fuelLevelBefore: 75,
        notes: 'Small scratch on rear bumper',
        photos: [
          { photoType: 'front', filePath: 'photos/front.jpg' },
          { photoType: 'back', filePath: 'photos/back.jpg' },
          { photoType: 'left', filePath: 'photos/left.jpg' },
          { photoType: 'right', filePath: 'photos/right.jpg' },
          { photoType: 'odometer', filePath: 'photos/odo.jpg' },
          { photoType: 'fuel_gauge', filePath: 'photos/fuel.jpg' },
        ],
      });
    expect(handoverRes.status).toBe(200);
    expect(handoverRes.body.data.tripStatus).toBe('handover_done');

    // 6. POST /trips/:id/start -> in_progress
    const startRes = await request(app)
      .post(`/api/v1/trips/${tripId}/start`)
      .set(authHeader);
    expect(startRes.status).toBe(200);
    expect(startRes.body.data.tripStatus).toBe('in_progress');

    // 7. POST /trips/:id/end -> completed (geofenced <= 200m of destination)
    // Mock driver location near destination [77.6401, 12.9701]
    vi.spyOn(tripsRepository, 'getDriverLatestLocation').mockResolvedValue({
      latitude: 12.9701,
      longitude: 77.6401,
      recorded_at: new Date().toISOString(),
    });

    const endRes = await request(app)
      .post(`/api/v1/trips/${tripId}/end`)
      .set(authHeader)
      .send({
        odometerAfter: 45028.5, // 8 km travelled
        fuelLevelAfter: 70,
        notes: 'Trip completed safely',
      });
    expect(endRes.status).toBe(200);
    expect(endRes.body.data.tripStatus).toBe('completed');
    expect(endRes.body.data.fare).toBeDefined();
    expect(endRes.body.data.payment.status).toBe('captured');
  });

  it('rejects out-of-order state transitions with 409 Conflict', async () => {
    // Current status is 'assigned'. Trying to start trip directly without arriving/handover:
    const invalidRes = await request(app)
      .post(`/api/v1/trips/${tripId}/start`)
      .set(authHeader);

    expect(invalidRes.status).toBe(409);
    expect(invalidRes.body.error.code).toBe('CONFLICT');
    expect(invalidRes.body.error.message).toContain('Cannot transition trip');
  });

  it('supports idempotent retries with Idempotency-Key header', async () => {
    const idempotencyKey = 'idem-key-trip-heading-001';

    // Mock idempotency cache
    let cachedValue: { response_status: number; response_body: unknown } | null = null;
    vi.spyOn(tripsRepository, 'getIdempotentResponse').mockImplementation(async (key) => {
      if (key === idempotencyKey && cachedValue) return cachedValue;
      return null;
    });
    vi.spyOn(tripsRepository, 'saveIdempotentResponse').mockImplementation(async (key, _res, status, body) => {
      if (key === idempotencyKey) cachedValue = { response_status: status, response_body: body };
    });

    // First call
    const res1 = await request(app)
      .post(`/api/v1/trips/${tripId}/start-heading`)
      .set(authHeader)
      .set('Idempotency-Key', idempotencyKey);
    expect(res1.status).toBe(200);
    expect(res1.body.data.tripStatus).toBe('heading_to_pickup');

    // Second call with same idempotency key (even though trip is now 'heading_to_pickup')
    const res2 = await request(app)
      .post(`/api/v1/trips/${tripId}/start-heading`)
      .set(authHeader)
      .set('Idempotency-Key', idempotencyKey);
    expect(res2.status).toBe(200);
    expect(res2.body.data.tripStatus).toBe('heading_to_pickup');
  });

  it('allows driver cancellation before trip start with a valid reason', async () => {
    currentTripStatus = 'heading_to_pickup';

    const cancelRes = await request(app)
      .post(`/api/v1/trips/${tripId}/cancel`)
      .set(authHeader)
      .send({ reason: 'Vehicle breakdown on way to pickup' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.tripStatus).toBe('cancelled_by_driver');
  });

  it('disallows driver cancellation once trip is in progress (409 Conflict)', async () => {
    currentTripStatus = 'in_progress';

    const cancelRes = await request(app)
      .post(`/api/v1/trips/${tripId}/cancel`)
      .set(authHeader)
      .send({ reason: 'Cannot complete trip' });

    expect(cancelRes.status).toBe(409);
    expect(cancelRes.body.error.message).toContain('Cannot transition trip');
  });

  it('returns customer phone only for active assigned trips', async () => {
    currentTripStatus = 'heading_to_pickup';
    vi.spyOn(tripsRepository, 'getCustomerContact').mockResolvedValue({
      customerId: '88888888-8888-8888-8888-888888888888',
      customerName: 'Rahul Sharma',
      phone: '+919876543210',
    });

    const contactRes = await request(app)
      .get(`/api/v1/trips/${tripId}/contact`)
      .set(authHeader);

    expect(contactRes.status).toBe(200);
    expect(contactRes.body.data.phone).toBe('+919876543210');
  });

  it('rejects customer phone access when trip is completed (403 Forbidden)', async () => {
    currentTripStatus = 'completed';

    const contactRes = await request(app)
      .get(`/api/v1/trips/${tripId}/contact`)
      .set(authHeader);

    expect(contactRes.status).toBe(403);
    expect(contactRes.body.error.message).toContain('active trip');
  });
});
