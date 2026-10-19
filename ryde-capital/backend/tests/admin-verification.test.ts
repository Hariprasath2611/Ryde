// ryde-capital/backend/tests/admin-verification.test.ts
// Vitest unit and integration tests for Admin driver review, document access, approvals, and rejections

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';
import { adminRepository } from '../src/modules/admin/repository.js';

describe('Admin Driver Verification & Review Module', () => {
  const adminUserId = '00000000-0000-0000-0000-000000000001';
  const driverUserId = '00000000-0000-0000-0000-000000000002';
  const testDriverId = '10000000-0000-0000-0000-000000000001';

  const adminAuthHeader = { Authorization: 'Bearer valid-admin-token' };
  const driverAuthHeader = { Authorization: 'Bearer valid-driver-token' };

  beforeEach(() => {
    vi.restoreAllMocks();

    // Default to admin user for admin endpoints
    vi.spyOn(supabaseServiceClient.auth, 'getUser').mockImplementation(async token => {
      if (token === 'valid-driver-token') {
        return {
          data: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user: {
              id: driverUserId,
              email: 'driver@ryde.in',
              user_metadata: { role: 'driver' },
              app_metadata: { role: 'driver' },
            } as any,
          },
          error: null,
        };
      }

      return {
        data: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          user: {
            id: adminUserId,
            email: 'admin@ryde.in',
            user_metadata: { role: 'admin' },
            app_metadata: { role: 'admin' },
          } as any,
        },
        error: null,
      };
    });
  });

  describe('RBAC & Route Protection', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/admin/drivers');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects drivers attempting to access admin routes with 403 Forbidden', async () => {
      const res = await request(app).get('/api/v1/admin/drivers').set(driverAuthHeader);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects drivers attempting to approve themselves with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/drivers/${testDriverId}/approve`)
        .set(driverAuthHeader);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/admin/drivers (List & Filter)', () => {
    it('lists drivers filtered by onboarding status and writes audit log', async () => {
      const auditSpy = vi.spyOn(adminRepository, 'createAuditLog').mockResolvedValue();
      vi.spyOn(adminRepository, 'listDrivers').mockResolvedValue({
        drivers: [
          {
            id: testDriverId,
            user_id: driverUserId,
            driver_code: 'DRV-1001',
            full_name: 'Ramesh Kumar',
            phone: '+919876543210',
            city: 'Bengaluru',
            state: 'Karnataka',
            onboarding_status: 'submitted',
            verification_status: 'pending',
            submitted_at: '2026-10-19T10:00:00Z',
            created_at: '2026-10-18T10:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      });

      const res = await request(app)
        .get('/api/v1/admin/drivers?status=submitted')
        .set(adminAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.drivers.length).toBe(1);
      expect(res.body.drivers[0].driver_code).toBe('DRV-1001');
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ADMIN_DRIVERS_LIST_VIEWED',
          user_id: adminUserId,
        }),
      );
    });
  });

  describe('GET /api/v1/admin/drivers/:driverId (Review with Signed URLs)', () => {
    it('returns driver review details with short-lived (60s) signed URLs and logs audit', async () => {
      const auditSpy = vi.spyOn(adminRepository, 'createAuditLog').mockResolvedValue();
      const signedUrlSpy = vi
        .spyOn(adminRepository, 'createSignedDownloadUrl')
        .mockResolvedValue('https://storage.supabase.co/signed?expires=60');

      vi.spyOn(adminRepository, 'getDriverDetails').mockResolvedValue({
        driver: {
          id: testDriverId,
          user_id: driverUserId,
          driver_code: 'DRV-1001',
          verification_status: 'pending',
          availability_status: 'offline',
          allowed_vehicle_types: ['four_wheeler'],
          rating_avg: 5.0,
          rating_count: 0,
          approved_by: null,
          approved_at: null,
          date_of_birth: '1995-05-15',
          address_line: '123 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          experience_years: 4,
          profile_photo_path: `${driverUserId}/selfie.jpg`,
          onboarding_status: 'submitted',
          rejection_reason: null,
          submitted_at: '2026-10-19T10:00:00Z',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        profile: {
          id: driverUserId,
          phone: '+919876543210',
          email: 'ramesh.kumar@driver.ryde.in',
          full_name: 'Ramesh Kumar',
          role: 'driver',
          account_status: 'active',
          phone_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        identityDocuments: [
          {
            id: 'id-doc-1',
            user_id: driverUserId,
            document_type: 'aadhaar',
            masked_reference: 'XXXX-XXXX-1234',
            file_path: `${driverUserId}/aadhaar.jpg`,
            verification_status: 'pending',
            reviewed_by: null,
            reviewed_at: null,
            expiry_date: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        drivingLicense: {
          id: 'dl-1',
          driver_id: testDriverId,
          license_number_masked: 'KA01-XXXX-9871',
          license_classes: ['four_wheeler'],
          expiry_date: '2030-12-31',
          file_path: `${driverUserId}/dl_front.jpg`,
          front_file_path: `${driverUserId}/dl_front.jpg`,
          back_file_path: `${driverUserId}/dl_back.jpg`,
          verification_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });

      const res = await request(app)
        .get(`/api/v1/admin/drivers/${testDriverId}`)
        .set(adminAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.driver.id).toBe(testDriverId);
      expect(res.body.documents.profilePhoto.signedUrl).toContain('https://storage.supabase.co');
      expect(res.body.documents.profilePhoto.expiresInSeconds).toBe(60);
      expect(res.body.documents.idProof.signedUrl).toContain('https://storage.supabase.co');
      expect(res.body.documents.license.frontSignedUrl).toContain('https://storage.supabase.co');
      expect(res.body.documents.license.backSignedUrl).toContain('https://storage.supabase.co');

      expect(signedUrlSpy).toHaveBeenCalledWith('driver-docs', expect.any(String), 60);
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ADMIN_DRIVER_DOCUMENTS_VIEWED',
          entity_id: testDriverId,
        }),
      );
    });
  });

  describe('POST /api/v1/admin/drivers/:driverId/approve', () => {
    it('approves driver, writes audit log, and creates in-app notification', async () => {
      const auditSpy = vi.spyOn(adminRepository, 'createAuditLog').mockResolvedValue();
      const notifySpy = vi.spyOn(adminRepository, 'createNotification').mockResolvedValue();

      vi.spyOn(adminRepository, 'getDriverDetails').mockResolvedValue({
        driver: {
          id: testDriverId,
          user_id: driverUserId,
          driver_code: 'DRV-1001',
          verification_status: 'pending',
          availability_status: 'offline',
          allowed_vehicle_types: ['four_wheeler'],
          rating_avg: 5.0,
          rating_count: 0,
          approved_by: null,
          approved_at: null,
          date_of_birth: '1995-05-15',
          address_line: '123 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          experience_years: 4,
          profile_photo_path: null,
          onboarding_status: 'submitted',
          rejection_reason: null,
          submitted_at: '2026-10-19T10:00:00Z',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        profile: {
          id: driverUserId,
          phone: '+919876543210',
          email: 'ramesh.kumar@driver.ryde.in',
          full_name: 'Ramesh Kumar',
          role: 'driver',
          account_status: 'active',
          phone_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        identityDocuments: [],
        drivingLicense: null,
      });

      vi.spyOn(adminRepository, 'approveDriver').mockResolvedValue({
        driver: {
          id: testDriverId,
          user_id: driverUserId,
          driver_code: 'DRV-1001',
          verification_status: 'approved',
          availability_status: 'offline',
          allowed_vehicle_types: ['four_wheeler'],
          rating_avg: 5.0,
          rating_count: 0,
          approved_by: adminUserId,
          approved_at: new Date().toISOString(),
          date_of_birth: '1995-05-15',
          address_line: '123 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          experience_years: 4,
          profile_photo_path: null,
          onboarding_status: 'approved',
          rejection_reason: null,
          submitted_at: '2026-10-19T10:00:00Z',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        profile: {
          id: driverUserId,
          phone: '+919876543210',
          email: 'ramesh.kumar@driver.ryde.in',
          full_name: 'Ramesh Kumar',
          role: 'driver',
          account_status: 'active',
          phone_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });

      const res = await request(app)
        .post(`/api/v1/admin/drivers/${testDriverId}/approve`)
        .set(adminAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.driver.onboarding_status).toBe('approved');
      expect(res.body.driver.verification_status).toBe('approved');
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ADMIN_DRIVER_APPROVED',
          entity_id: testDriverId,
        }),
      );
      expect(notifySpy).toHaveBeenCalledWith(
        driverUserId,
        'Account Approved',
        expect.stringContaining('approved'),
        'driver_approved',
      );
    });
  });

  describe('POST /api/v1/admin/drivers/:driverId/reject', () => {
    it('requires a rejection reason with minimum length 5', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/drivers/${testDriverId}/reject`)
        .set(adminAuthHeader)
        .send({ reason: 'Bad' }); // too short

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('rejects driver, updates rejection reason, writes audit log and notification', async () => {
      const auditSpy = vi.spyOn(adminRepository, 'createAuditLog').mockResolvedValue();
      const notifySpy = vi.spyOn(adminRepository, 'createNotification').mockResolvedValue();

      vi.spyOn(adminRepository, 'getDriverDetails').mockResolvedValue({
        driver: {
          id: testDriverId,
          user_id: driverUserId,
          driver_code: 'DRV-1001',
          verification_status: 'pending',
          availability_status: 'offline',
          allowed_vehicle_types: ['four_wheeler'],
          rating_avg: 5.0,
          rating_count: 0,
          approved_by: null,
          approved_at: null,
          date_of_birth: '1995-05-15',
          address_line: '123 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          experience_years: 4,
          profile_photo_path: null,
          onboarding_status: 'submitted',
          rejection_reason: null,
          submitted_at: '2026-10-19T10:00:00Z',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        profile: {
          id: driverUserId,
          phone: '+919876543210',
          email: 'ramesh.kumar@driver.ryde.in',
          full_name: 'Ramesh Kumar',
          role: 'driver',
          account_status: 'active',
          phone_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        identityDocuments: [],
        drivingLicense: null,
      });

      vi.spyOn(adminRepository, 'rejectDriver').mockResolvedValue({
        driver: {
          id: testDriverId,
          user_id: driverUserId,
          driver_code: 'DRV-1001',
          verification_status: 'rejected',
          availability_status: 'offline',
          allowed_vehicle_types: ['four_wheeler'],
          rating_avg: 5.0,
          rating_count: 0,
          approved_by: adminUserId,
          approved_at: null,
          date_of_birth: '1995-05-15',
          address_line: '123 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          experience_years: 4,
          profile_photo_path: null,
          onboarding_status: 'rejected',
          rejection_reason: 'Driving license image is blurry. Please re-upload.',
          submitted_at: '2026-10-19T10:00:00Z',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        profile: {
          id: driverUserId,
          phone: '+919876543210',
          email: 'ramesh.kumar@driver.ryde.in',
          full_name: 'Ramesh Kumar',
          role: 'driver',
          account_status: 'active',
          phone_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });

      const res = await request(app)
        .post(`/api/v1/admin/drivers/${testDriverId}/reject`)
        .set(adminAuthHeader)
        .send({ reason: 'Driving license image is blurry. Please re-upload.' });

      expect(res.status).toBe(200);
      expect(res.body.driver.onboarding_status).toBe('rejected');
      expect(res.body.driver.rejection_reason).toContain('blurry');
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ADMIN_DRIVER_REJECTED',
          metadata: expect.objectContaining({
            rejection_reason: 'Driving license image is blurry. Please re-upload.',
          }),
        }),
      );
      expect(notifySpy).toHaveBeenCalledWith(
        driverUserId,
        'Verification Requires Attention',
        expect.stringContaining('blurry'),
        'driver_rejected',
      );
    });
  });
});
