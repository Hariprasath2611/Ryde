import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';
import { locationRepository } from '../src/modules/location/repository.js';

describe('Driver Live Location (Task 1: POST /api/v1/drivers/me/location)', () => {
  const driverUserId = '22222222-2222-2222-2222-222222222222';
  const driverId = '33333333-3333-3333-3333-333333333333';
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

    vi.spyOn(locationRepository, 'getDriverByUserId').mockResolvedValue({
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

    vi.spyOn(locationRepository, 'recordLocations').mockResolvedValue();
  });

  it('accepts a valid location point', async () => {
    const res = await request(app)
      .post('/api/v1/drivers/me/location')
      .set(authHeader)
      .send({
        latitude: 12.9716,
        longitude: 77.5946,
        heading: 180,
        speed: 25.5,
        accuracy: 12,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.accepted).toBe(1);
    expect(res.body.data.dropped).toBe(0);
    expect(res.body.data.latest).toBeDefined();
    expect(res.body.data.latest.latitude).toBe(12.9716);
  });

  it('rejects invalid coordinates out of range (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/v1/drivers/me/location')
      .set(authHeader)
      .send({
        latitude: 95.0, // Invalid: > 90
        longitude: 77.5946,
      });

    expect(res.status).toBe(400);
  });

  it('rejects stale timestamps older than 10 minutes (400 Bad Request)', async () => {
    const staleTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/v1/drivers/me/location')
      .set(authHeader)
      .send({
        latitude: 12.9716,
        longitude: 77.5946,
        recorded_at: staleTime,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('stale');
  });

  it('rejects future timestamps > 30 seconds ahead (400 Bad Request)', async () => {
    const futureTime = new Date(Date.now() + 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/v1/drivers/me/location')
      .set(authHeader)
      .send({
        latitude: 12.9716,
        longitude: 77.5946,
        recorded_at: futureTime,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('future');
  });

  it('rejects impossible speeds > 150 km/h (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/v1/drivers/me/location')
      .set(authHeader)
      .send({
        latitude: 12.9716,
        longitude: 77.5946,
        speed: 180, // Impossible speed
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Impossible speed');
  });

  it('drops low accuracy points (> 50m)', async () => {
    const res = await request(app)
      .post('/api/v1/drivers/me/location')
      .set(authHeader)
      .send({
        latitude: 12.9716,
        longitude: 77.5946,
        accuracy: 85, // Low accuracy > 50m
      });

    expect(res.status).toBe(200);
    expect(res.body.data.accepted).toBe(0);
    expect(res.body.data.dropped).toBe(1);
    expect(res.body.data.latest).toBeNull();
  });

  it('accepts batch of up to 20 location points for reconnect sync', async () => {
    const now = Date.now();
    const points = Array.from({ length: 5 }, (_, i) => ({
      latitude: 12.9716 + i * 0.001,
      longitude: 77.5946 + i * 0.001,
      heading: 90,
      speed: 20,
      accuracy: 10,
      recorded_at: new Date(now - (5 - i) * 1000).toISOString(),
    }));

    const res = await request(app)
      .post('/api/v1/drivers/me/location/batch')
      .set(authHeader)
      .send({ locations: points });

    expect(res.status).toBe(200);
    expect(res.body.data.accepted).toBe(5);
    expect(res.body.data.dropped).toBe(0);
    expect(res.body.data.latest).toBeDefined();
  });

  it('rejects batch exceeding 20 points (400 Bad Request)', async () => {
    const points = Array.from({ length: 25 }, () => ({
      latitude: 12.9716,
      longitude: 77.5946,
    }));

    const res = await request(app)
      .post('/api/v1/drivers/me/location/batch')
      .set(authHeader)
      .send({ locations: points });

    expect(res.status).toBe(400);
  });
});
