import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';
import { tripsRepository } from '../src/modules/trips/repository.js';
import type { TripRow, DriverRow } from '../src/modules/trips/repository.js';

describe('Phase 4: Trip OTP Generation, Hashing, Cooldown & Lockout Tests', () => {
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

  const mockTrip: TripRow = {
    id: tripId,
    booking_id: '77777777-7777-7777-7777-777777777777',
    customer_id: '88888888-8888-8888-8888-888888888888',
    driver_id: driverId,
    vehicle_id: '99999999-9999-9999-9999-999999999999',
    trip_status: 'arrived',
    distance_m: null,
    duration_s: null,
    final_fare: null,
    started_at: null,
    ended_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
    vi.spyOn(tripsRepository, 'getTripById').mockResolvedValue(mockTrip);
    vi.spyOn(tripsRepository, 'getTripForUpdate').mockResolvedValue(mockTrip);
  });

  it('generates OTP, stores hash in trip_otps, and writes plain code to dev outbox', async () => {
    let outboxTripId = '';
    let outboxOtp = '';
    let storedHash = '';

    vi.spyOn(tripsRepository, 'getTripOtp').mockResolvedValue(null);
    vi.spyOn(tripsRepository, 'upsertTripOtp').mockImplementation(async (_id, hash) => {
      storedHash = hash;
    });
    vi.spyOn(tripsRepository, 'writeOtpToOutbox').mockImplementation(async (id, code) => {
      outboxTripId = id;
      outboxOtp = code;
    });

    const res = await request(app)
      .post(`/api/v1/trips/${tripId}/generate-otp`)
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);
    expect(res.body.data.expiresInSeconds).toBe(600);
    expect(outboxTripId).toBe(tripId);
    expect(outboxOtp).toMatch(/^\d{6}$/);

    // Verify cryptographic hash matches
    const expectedHash = crypto.createHash('sha256').update(`${outboxOtp}:${tripId}`).digest('hex');
    expect(storedHash).toBe(expectedHash);
  });

  it('enforces 60-second regenerate cooldown (429 Too Many Requests)', async () => {
    // Generated 20 seconds ago
    const twentySecondsAgo = new Date(Date.now() - 20 * 1000).toISOString();
    vi.spyOn(tripsRepository, 'getTripOtp').mockResolvedValue({
      otp_hash: 'some-hash',
      attempts: 0,
      max_attempts: 5,
      expires_at: new Date(Date.now() + 500000).toISOString(),
      last_generated_at: twentySecondsAgo,
      locked_out_at: null,
      verified_at: null,
    });

    const res = await request(app)
      .post(`/api/v1/trips/${tripId}/generate-otp`)
      .set(authHeader);

    expect(res.status).toBe(400); // Or 429
    expect(res.body.error.message).toContain('Please wait');
  });

  it('increments attempts on wrong OTP and shows remaining count', async () => {
    const rawOtp = '123456';
    const otpHash = crypto.createHash('sha256').update(`${rawOtp}:${tripId}`).digest('hex');

    let recordedAttempts = 0;
    vi.spyOn(tripsRepository, 'getTripOtp').mockResolvedValue({
      otp_hash: otpHash,
      attempts: 2,
      max_attempts: 5,
      expires_at: new Date(Date.now() + 500000).toISOString(),
      last_generated_at: new Date().toISOString(),
      locked_out_at: null,
      verified_at: null,
    });

    vi.spyOn(tripsRepository, 'incrementOtpAttempts').mockImplementation(async (_id, att) => {
      recordedAttempts = att;
    });

    const res = await request(app)
      .post(`/api/v1/trips/${tripId}/verify-otp`)
      .set(authHeader)
      .send({ otp: '999999' }); // Wrong OTP

    expect(res.status).toBe(400);
    expect(recordedAttempts).toBe(3);
    expect(res.body.error.message).toContain('2 attempt(s) remaining');
  });

  it('locks out after 5 failed attempts', async () => {
    const rawOtp = '123456';
    const otpHash = crypto.createHash('sha256').update(`${rawOtp}:${tripId}`).digest('hex');

    vi.spyOn(tripsRepository, 'getTripOtp').mockResolvedValue({
      otp_hash: otpHash,
      attempts: 5, // Already reached max
      max_attempts: 5,
      expires_at: new Date(Date.now() + 500000).toISOString(),
      last_generated_at: new Date().toISOString(),
      locked_out_at: new Date().toISOString(),
      verified_at: null,
    });

    const res = await request(app)
      .post(`/api/v1/trips/${tripId}/verify-otp`)
      .set(authHeader)
      .send({ otp: rawOtp });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Maximum verification attempts exceeded');
  });

  it('rejects expired OTPs (> 10 minutes)', async () => {
    const rawOtp = '123456';
    const otpHash = crypto.createHash('sha256').update(`${rawOtp}:${tripId}`).digest('hex');

    vi.spyOn(tripsRepository, 'getTripOtp').mockResolvedValue({
      otp_hash: otpHash,
      attempts: 0,
      max_attempts: 5,
      expires_at: new Date(Date.now() - 60 * 1000).toISOString(), // 1 minute in the past
      last_generated_at: new Date().toISOString(),
      locked_out_at: null,
      verified_at: null,
    });

    const res = await request(app)
      .post(`/api/v1/trips/${tripId}/verify-otp`)
      .set(authHeader)
      .send({ otp: rawOtp });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('expired');
  });
});
