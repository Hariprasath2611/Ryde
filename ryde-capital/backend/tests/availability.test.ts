import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';
import { availabilityRepository } from '../src/modules/availability/repository.js';

describe('Driver Availability (Task 1: PUT /api/v1/drivers/me/availability)', () => {
  const driverUserId = '22222222-2222-2222-2222-222222222222';
  const driverId = '33333333-3333-3333-3333-333333333333';
  const authHeader = { Authorization: 'Bearer valid-driver-token' };

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock auth middleware to return driver role
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

  it('rejects unapproved drivers from changing availability (403 Forbidden)', async () => {
    vi.spyOn(availabilityRepository, 'getDriverByUserId').mockResolvedValue({
      id: driverId,
      user_id: driverUserId,
      driver_code: 'DRV-TEST',
      verification_status: 'pending',
      onboarding_status: 'in_progress',
      availability_status: 'offline',
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

    const res = await request(app)
      .put('/api/v1/drivers/me/availability')
      .set(authHeader)
      .send({ status: 'online' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toContain('Only approved drivers');
  });

  it('rejects going online without a recent location update (400 Bad Request)', async () => {
    vi.spyOn(availabilityRepository, 'getDriverByUserId').mockResolvedValue({
      id: driverId,
      user_id: driverUserId,
      driver_code: 'DRV-TEST',
      verification_status: 'approved',
      onboarding_status: 'approved',
      availability_status: 'offline',
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

    // Mock no recent location
    vi.spyOn(availabilityRepository, 'getDriverLocation').mockResolvedValue(null);

    const res = await request(app)
      .put('/api/v1/drivers/me/availability')
      .set(authHeader)
      .send({ status: 'online' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.error.message).toContain('Cannot go online without a recent location');
  });

  it('rejects going online when location is older than 10 minutes (400 Bad Request)', async () => {
    vi.spyOn(availabilityRepository, 'getDriverByUserId').mockResolvedValue({
      id: driverId,
      user_id: driverUserId,
      driver_code: 'DRV-TEST',
      verification_status: 'approved',
      onboarding_status: 'approved',
      availability_status: 'offline',
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

    // Stale location 15 mins ago
    vi.spyOn(availabilityRepository, 'getDriverLocation').mockResolvedValue({
      driver_id: driverId,
      location: 'POINT(77.5946 12.9716)',
      heading: 90,
      speed: 10,
      updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    });

    const res = await request(app)
      .put('/api/v1/drivers/me/availability')
      .set(authHeader)
      .send({ isAvailable: true });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.error.message).toContain('Location is stale');
  });

  it('successfully transitions to online when approved and has recent location', async () => {
    vi.spyOn(availabilityRepository, 'getDriverByUserId').mockResolvedValue({
      id: driverId,
      user_id: driverUserId,
      driver_code: 'DRV-TEST',
      verification_status: 'approved',
      onboarding_status: 'approved',
      availability_status: 'offline',
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

    // Fresh location 1 min ago
    vi.spyOn(availabilityRepository, 'getDriverLocation').mockResolvedValue({
      driver_id: driverId,
      location: 'POINT(77.5946 12.9716)',
      heading: 90,
      speed: 10,
      updated_at: new Date(Date.now() - 60 * 1000).toISOString(),
    });

    vi.spyOn(availabilityRepository, 'setDriverAvailability').mockResolvedValue({
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

    const res = await request(app)
      .put('/api/v1/drivers/me/availability')
      .set(authHeader)
      .send({ status: 'online' });

    expect(res.status).toBe(200);
    expect(res.body.data.availabilityStatus).toBe('online');
    expect(res.body.data.isAvailable).toBe(true);
  });

  it('rejects going offline during an active trip (409 Conflict)', async () => {
    vi.spyOn(availabilityRepository, 'getDriverByUserId').mockResolvedValue({
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

    // Mock active trip
    vi.spyOn(availabilityRepository, 'hasActiveTrip').mockResolvedValue(true);

    const res = await request(app)
      .put('/api/v1/drivers/me/availability')
      .set(authHeader)
      .send({ status: 'offline' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.message).toContain('active trip');
  });

  it('allows going offline when not on an active trip', async () => {
    vi.spyOn(availabilityRepository, 'getDriverByUserId').mockResolvedValue({
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

    vi.spyOn(availabilityRepository, 'hasActiveTrip').mockResolvedValue(false);
    vi.spyOn(availabilityRepository, 'setDriverAvailability').mockResolvedValue({
      id: driverId,
      user_id: driverUserId,
      driver_code: 'DRV-TEST',
      verification_status: 'approved',
      onboarding_status: 'approved',
      availability_status: 'offline',
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

    const res = await request(app)
      .put('/api/v1/drivers/me/availability')
      .set(authHeader)
      .send({ isAvailable: false });

    expect(res.status).toBe(200);
    expect(res.body.data.availabilityStatus).toBe('offline');
    expect(res.body.data.isAvailable).toBe(false);
  });
});
