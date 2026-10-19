import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';
import { authRepository } from '../src/modules/auth/repository.js';

describe('Auth Module & RBAC Integration Tests', () => {
  const driverUserId = '22222222-2222-2222-2222-222222222222';
  const customerUserId = '33333333-3333-3333-3333-333333333333';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/v1/auth/complete-signup', () => {
    it('should return 401 when token is missing or invalid', async () => {
      const res = await request(app).post('/api/v1/auth/complete-signup').send({
        full_name: 'Test Driver',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should successfully complete signup for a new driver and ignore client-supplied role', async () => {
      // Mock Supabase getUser
      vi.spyOn(supabaseServiceClient.auth, 'getUser').mockResolvedValueOnce({
        data: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          user: {
            id: driverUserId,
            phone: '+919876543210',
            email: 'newdriver@ryde.in',
            app_metadata: {},
            user_metadata: { role: 'admin' }, // Malicious attempt to self-elevate
          } as any,
        },
        error: null,
      });

      const mockProfile = {
        id: driverUserId,
        phone: '+919876543210',
        email: 'newdriver@ryde.in',
        full_name: 'Super Driver',
        role: 'driver' as const, // Server strictly enforces 'driver'
        account_status: 'active' as const,
        phone_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockDriver = {
        id: '99999999-9999-9999-9999-999999999999',
        user_id: driverUserId,
        driver_code: 'DRV-22222222',
        verification_status: 'pending' as const,
        availability_status: 'offline' as const,
        allowed_vehicle_types: ['four_wheeler' as const],
        rating_avg: 5.0,
        rating_count: 0,
        approved_by: null,
        approved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const upsertProfileSpy = vi
        .spyOn(authRepository, 'upsertProfile')
        .mockResolvedValueOnce(mockProfile);

      const getDriverSpy = vi
        .spyOn(authRepository, 'getDriverByUserId')
        .mockResolvedValueOnce(null);

      const createDriverSpy = vi
        .spyOn(authRepository, 'createDriver')
        .mockResolvedValueOnce(mockDriver);

      const setMetaSpy = vi
        .spyOn(authRepository, 'setAppMetadataRole')
        .mockResolvedValueOnce(undefined);

      const auditSpy = vi
        .spyOn(authRepository, 'createAuditLog')
        .mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/api/v1/auth/complete-signup')
        .set('Authorization', 'Bearer valid-jwt-token')
        .send({
          full_name: 'Super Driver',
          role: 'admin', // Malicious client attempt
          allowed_vehicle_types: ['four_wheeler'],
        });

      expect(res.status).toBe(200);
      expect(res.body.profile).toBeDefined();
      expect(res.body.profile.role).toBe('driver');
      expect(res.body.driver).toBeDefined();
      expect(res.body.driver.verification_status).toBe('pending');

      // Verify that server enforced 'driver' role regardless of input
      expect(upsertProfileSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: driverUserId,
          role: 'driver',
        }),
      );
      expect(createDriverSpy).toHaveBeenCalled();
      expect(setMetaSpy).toHaveBeenCalledWith(driverUserId, 'driver');
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DRIVER_SIGNUP_COMPLETED',
          entity_type: 'driver',
        }),
      );
    });

    it('should be idempotent on repeat calls (does not duplicate driver)', async () => {
      vi.spyOn(supabaseServiceClient.auth, 'getUser').mockResolvedValueOnce({
        data: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          user: {
            id: driverUserId,
            phone: '+919876543210',
            app_metadata: { role: 'driver' },
            user_metadata: {},
          } as any,
        },
        error: null,
      });

      const existingProfile = {
        id: driverUserId,
        phone: '+919876543210',
        email: null,
        full_name: 'Super Driver',
        role: 'driver' as const,
        account_status: 'active' as const,
        phone_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const existingDriver = {
        id: '99999999-9999-9999-9999-999999999999',
        user_id: driverUserId,
        driver_code: 'DRV-22222222',
        verification_status: 'approved' as const,
        availability_status: 'online' as const,
        allowed_vehicle_types: ['four_wheeler' as const],
        rating_avg: 4.95,
        rating_count: 50,
        approved_by: null,
        approved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(authRepository, 'upsertProfile').mockResolvedValueOnce(existingProfile);
      vi.spyOn(authRepository, 'getDriverByUserId').mockResolvedValueOnce(existingDriver);
      const createDriverSpy = vi.spyOn(authRepository, 'createDriver');
      vi.spyOn(authRepository, 'setAppMetadataRole').mockResolvedValueOnce(undefined);
      vi.spyOn(authRepository, 'createAuditLog').mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/api/v1/auth/complete-signup')
        .set('Authorization', 'Bearer valid-jwt-token')
        .send({
          full_name: 'Super Driver',
        });

      expect(res.status).toBe(200);
      expect(res.body.profile.id).toBe(driverUserId);
      expect(res.body.driver.id).toBe(existingDriver.id);
      expect(res.body.driver.verification_status).toBe('approved');
      // Did NOT create a second driver row
      expect(createDriverSpy).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/auth/me (Upgraded Profile + Driver Record)', () => {
    it('should return profile and driver record with verification and availability status', async () => {
      vi.spyOn(supabaseServiceClient.auth, 'getUser').mockResolvedValueOnce({
        data: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          user: {
            id: driverUserId,
            phone: '+919876543210',
            email: 'driver@ryde.in',
            app_metadata: { role: 'driver' },
            user_metadata: {},
          } as any,
        },
        error: null,
      });

      const mockProfile = {
        id: driverUserId,
        phone: '+919876543210',
        email: 'driver@ryde.in',
        full_name: 'Ramesh Kumar',
        role: 'driver' as const,
        account_status: 'active' as const,
        phone_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockDriver = {
        id: '10000000-0000-0000-0000-000000000001',
        user_id: driverUserId,
        driver_code: 'DRV-1001',
        verification_status: 'approved' as const,
        availability_status: 'online' as const,
        allowed_vehicle_types: ['four_wheeler' as const],
        rating_avg: 4.9,
        rating_count: 42,
        approved_by: null,
        approved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(authRepository, 'getProfileById').mockResolvedValueOnce(mockProfile);
      vi.spyOn(authRepository, 'getDriverByUserId').mockResolvedValueOnce(mockDriver);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid-jwt-token');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(driverUserId);
      expect(res.body.role).toBe('driver');
      expect(res.body.driver).toBeDefined();
      expect(res.body.driver.verification_status).toBe('approved');
      expect(res.body.driver.availability_status).toBe('online');
      expect(res.body.driver.rating_avg).toBe(4.9);
    });
  });

  describe('RBAC Middleware Enforcement', () => {
    it('should reject a customer token on driver endpoints with 403 Forbidden', async () => {
      vi.spyOn(supabaseServiceClient.auth, 'getUser').mockResolvedValueOnce({
        data: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          user: {
            id: customerUserId,
            phone: '+919876543220',
            app_metadata: { role: 'customer' },
            user_metadata: { role: 'customer' },
          } as any,
        },
        error: null,
      });

      const res = await request(app)
        .get('/api/v1/drivers/me')
        .set('Authorization', 'Bearer customer-token');

      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toContain('Access denied');
    });

    it('should reject a customer token on assignments endpoint with 403 Forbidden', async () => {
      vi.spyOn(supabaseServiceClient.auth, 'getUser').mockResolvedValueOnce({
        data: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          user: {
            id: customerUserId,
            phone: '+919876543220',
            app_metadata: { role: 'customer' },
            user_metadata: { role: 'customer' },
          } as any,
        },
        error: null,
      });

      const res = await request(app)
        .get('/api/v1/assignments')
        .set('Authorization', 'Bearer customer-token');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
