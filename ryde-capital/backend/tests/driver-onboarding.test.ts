// ryde-capital/backend/tests/driver-onboarding.test.ts
// Vitest unit and integration tests for Phase 2 driver onboarding and document verification

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';
import { driverRepository } from '../src/modules/driver/repository.js';
import { defaultIdentityVerificationProvider } from '@ryde/shared';

describe('Driver Onboarding & Document Verification Flow', () => {
  const testUserId = '00000000-0000-0000-0000-000000000002';
  const testDriverId = '10000000-0000-0000-0000-000000000001';
  const driverAuthHeader = { Authorization: 'Bearer valid-driver-token' };

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock authenticated driver auth token
    vi.spyOn(supabaseServiceClient.auth, 'getUser').mockResolvedValue({
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user: {
          id: testUserId,
          email: 'ramesh.kumar@driver.ryde.in',
          phone: '+919876543210',
          user_metadata: { role: 'driver', full_name: 'Ramesh Kumar' },
          app_metadata: { role: 'driver' },
        } as any,
      },
      error: null,
    });

    vi.spyOn(driverRepository, 'getIdentityDocumentByUserId').mockResolvedValue(null);
    vi.spyOn(driverRepository, 'getDrivingLicenseByDriverId').mockResolvedValue(null);
    vi.spyOn(driverRepository, 'createAuditLog').mockResolvedValue();
  });

  describe('GET /api/v1/drivers/me (Profile & Checklist)', () => {
    it('returns 200 with driver profile and all 5 checklist steps', async () => {
      vi.spyOn(driverRepository, 'getDriverByUserId').mockResolvedValue({
        id: testDriverId,
        user_id: testUserId,
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
        profile_photo_path: `${testUserId}/profile_photo_1.jpg`,
        onboarding_status: 'in_progress',
        rejection_reason: null,
        submitted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(driverRepository, 'getProfileById').mockResolvedValue({
        id: testUserId,
        phone: '+919876543210',
        email: 'ramesh.kumar@driver.ryde.in',
        full_name: 'Ramesh Kumar',
        role: 'driver',
        account_status: 'active',
        phone_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(driverRepository, 'getIdentityDocumentByUserId').mockResolvedValue({
        id: 'id-doc-1',
        user_id: testUserId,
        document_type: 'aadhaar',
        masked_reference: 'XXXX-XXXX-1234',
        file_path: `${testUserId}/id_proof_1.jpg`,
        verification_status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        expiry_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(driverRepository, 'getDrivingLicenseByDriverId').mockResolvedValue({
        id: 'dl-1',
        driver_id: testDriverId,
        license_number_masked: 'KA01-XXXX-9871',
        license_classes: ['four_wheeler'],
        expiry_date: '2032-12-31',
        file_path: `${testUserId}/license_front_1.jpg`,
        front_file_path: `${testUserId}/license_front_1.jpg`,
        back_file_path: `${testUserId}/license_back_1.jpg`,
        verification_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app).get('/api/v1/drivers/me').set(driverAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.driver.id).toBe(testDriverId);
      expect(res.body.onboarding).toBeDefined();
      expect(res.body.onboarding.totalStepsCount).toBe(5);
      expect(res.body.onboarding.completedStepsCount).toBe(5);
      expect(res.body.onboarding.progressPercentage).toBe(100);
      expect(res.body.onboarding.canSubmit).toBe(true);
      expect(res.body.onboarding.steps.personalDetails.status).toBe('completed');
      expect(res.body.onboarding.steps.vehicleTypes.status).toBe('completed');
      expect(res.body.onboarding.steps.idProof.status).toBe('completed');
      expect(res.body.onboarding.steps.license.status).toBe('completed');
      expect(res.body.onboarding.steps.selfie.status).toBe('completed');
    });

    it('returns 404 if driver record does not exist', async () => {
      vi.spyOn(driverRepository, 'getDriverByUserId').mockResolvedValue(null);

      const res = await request(app).get('/api/v1/drivers/me').set(driverAuthHeader);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/drivers/me (Validation & Updates)', () => {
    beforeEach(() => {
      vi.spyOn(driverRepository, 'getDriverByUserId').mockResolvedValue({
        id: testDriverId,
        user_id: testUserId,
        driver_code: 'DRV-1001',
        verification_status: 'pending',
        availability_status: 'offline',
        allowed_vehicle_types: ['four_wheeler'],
        rating_avg: 5.0,
        rating_count: 0,
        approved_by: null,
        approved_at: null,
        date_of_birth: null,
        address_line: null,
        city: null,
        state: null,
        pincode: null,
        experience_years: 0,
        profile_photo_path: null,
        onboarding_status: 'not_started',
        rejection_reason: null,
        submitted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(driverRepository, 'getProfileById').mockResolvedValue({
        id: testUserId,
        phone: '+919876543210',
        email: 'ramesh.kumar@driver.ryde.in',
        full_name: 'Ramesh Kumar',
        role: 'driver',
        account_status: 'active',
        phone_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    it('rejects driver under 18 years of age with 400 Bad Request', async () => {
      const futureDob = new Date();
      futureDob.setFullYear(futureDob.getFullYear() - 16); // 16 years old
      const dobStr = futureDob.toISOString().split('T')[0];

      const res = await request(app).patch('/api/v1/drivers/me').set(driverAuthHeader).send({
        dateOfBirth: dobStr,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('rejects invalid Indian pincode with 400 Bad Request', async () => {
      const res = await request(app).patch('/api/v1/drivers/me').set(driverAuthHeader).send({
        pincode: '012345', // Indian PIN code cannot start with 0
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('successfully updates personal details and advances not_started to in_progress', async () => {
      const updateDriverSpy = vi.spyOn(driverRepository, 'updateDriver').mockResolvedValue({
        id: testDriverId,
        user_id: testUserId,
        driver_code: 'DRV-1001',
        verification_status: 'pending',
        availability_status: 'offline',
        allowed_vehicle_types: ['four_wheeler', 'two_wheeler'],
        rating_avg: 5.0,
        rating_count: 0,
        approved_by: null,
        approved_at: null,
        date_of_birth: '1992-08-20',
        address_line: '45 Indiranagar 100ft Rd',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        experience_years: 6,
        profile_photo_path: null,
        onboarding_status: 'in_progress',
        rejection_reason: null,
        submitted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app)
        .patch('/api/v1/drivers/me')
        .set(driverAuthHeader)
        .send({
          dateOfBirth: '1992-08-20',
          addressLine: '45 Indiranagar 100ft Rd',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
          experienceYears: 6,
          allowedVehicleTypes: ['four_wheeler', 'two_wheeler'],
        });

      expect(res.status).toBe(200);
      expect(updateDriverSpy).toHaveBeenCalledWith(
        testDriverId,
        expect.objectContaining({
          date_of_birth: '1992-08-20',
          city: 'Bengaluru',
          pincode: '560038',
          onboarding_status: 'in_progress',
        }),
      );
    });
  });

  describe('Document Uploads & Signed URLs', () => {
    beforeEach(() => {
      vi.spyOn(driverRepository, 'getDriverByUserId').mockResolvedValue({
        id: testDriverId,
        user_id: testUserId,
        driver_code: 'DRV-1001',
        verification_status: 'pending',
        availability_status: 'offline',
        allowed_vehicle_types: ['four_wheeler'],
        rating_avg: 5.0,
        rating_count: 0,
        approved_by: null,
        approved_at: null,
        date_of_birth: '1990-01-01',
        address_line: 'Test Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        experience_years: 3,
        profile_photo_path: null,
        onboarding_status: 'in_progress',
        rejection_reason: null,
        submitted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(driverRepository, 'getProfileById').mockResolvedValue({
        id: testUserId,
        phone: '+919876543210',
        email: 'ramesh.kumar@driver.ryde.in',
        full_name: 'Ramesh Kumar',
        role: 'driver',
        account_status: 'active',
        phone_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    it('POST /me/documents/upload-url enforces 5 MB maximum size limit', async () => {
      const res = await request(app)
        .post('/api/v1/drivers/me/documents/upload-url')
        .set(driverAuthHeader)
        .send({
          type: 'id_proof',
          contentType: 'image/jpeg',
          size: 6 * 1024 * 1024, // 6 MB
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('POST /me/documents/upload-url returns short-lived signed URL for valid document', async () => {
      vi.spyOn(driverRepository, 'createSignedUploadUrl').mockResolvedValue({
        signedUrl: 'https://storage.supabase.co/upload?token=test-signed-token',
        token: 'test-signed-token',
        path: `${testUserId}/id_proof_123.jpg`,
      });

      const res = await request(app)
        .post('/api/v1/drivers/me/documents/upload-url')
        .set(driverAuthHeader)
        .send({
          type: 'id_proof',
          contentType: 'image/jpeg',
          size: 2 * 1024 * 1024,
        });

      expect(res.status).toBe(200);
      expect(res.body.signedUrl).toContain('https://storage.supabase.co/upload');
      expect(res.body.filePath).toContain(`${testUserId}/id_proof_`);
      expect(res.body.expiresIn).toBe(900);
    });

    it('POST /me/documents rejects documents belonging to another user', async () => {
      const otherUserId = '99999999-9999-9999-9999-999999999999';

      const res = await request(app)
        .post('/api/v1/drivers/me/documents')
        .set(driverAuthHeader)
        .send({
          type: 'id_proof',
          filePath: `${otherUserId}/id_proof_hacked.jpg`,
          maskedReference: 'XXXX-XXXX-9999',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('POST /me/documents rejects expired driving license date', async () => {
      const res = await request(app)
        .post('/api/v1/drivers/me/documents')
        .set(driverAuthHeader)
        .send({
          type: 'license_front',
          filePath: `${testUserId}/license_front_1.jpg`,
          licenseNumberMasked: 'KA01-XXXX-9999',
          expiryDate: '2020-01-01', // Expired in past
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('future');
    });
  });

  describe('POST /api/v1/drivers/me/submit-for-review', () => {
    it('rejects submission when checklist is incomplete', async () => {
      // Driver with missing selfie and ID proof
      vi.spyOn(driverRepository, 'getDriverByUserId').mockResolvedValue({
        id: testDriverId,
        user_id: testUserId,
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
        profile_photo_path: null, // missing selfie
        onboarding_status: 'in_progress',
        rejection_reason: null,
        submitted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(driverRepository, 'getProfileById').mockResolvedValue({
        id: testUserId,
        phone: '+919876543210',
        email: 'ramesh.kumar@driver.ryde.in',
        full_name: 'Ramesh Kumar',
        role: 'driver',
        account_status: 'active',
        phone_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(driverRepository, 'getIdentityDocumentByUserId').mockResolvedValue(null);
      vi.spyOn(driverRepository, 'getDrivingLicenseByDriverId').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/drivers/me/submit-for-review')
        .set(driverAuthHeader);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toContain('incomplete');
    });

    it('transitions to submitted and writes audit log when all 5 steps complete', async () => {
      vi.spyOn(driverRepository, 'getDriverByUserId').mockResolvedValue({
        id: testDriverId,
        user_id: testUserId,
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
        profile_photo_path: `${testUserId}/selfie.jpg`,
        onboarding_status: 'in_progress',
        rejection_reason: null,
        submitted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(driverRepository, 'getProfileById').mockResolvedValue({
        id: testUserId,
        phone: '+919876543210',
        email: 'ramesh.kumar@driver.ryde.in',
        full_name: 'Ramesh Kumar',
        role: 'driver',
        account_status: 'active',
        phone_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(driverRepository, 'getIdentityDocumentByUserId').mockResolvedValue({
        id: 'id-doc-1',
        user_id: testUserId,
        document_type: 'aadhaar',
        masked_reference: 'XXXX-XXXX-1234',
        file_path: `${testUserId}/id_proof.jpg`,
        verification_status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        expiry_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(driverRepository, 'getDrivingLicenseByDriverId').mockResolvedValue({
        id: 'dl-1',
        driver_id: testDriverId,
        license_number_masked: 'KA01-XXXX-9871',
        license_classes: ['four_wheeler'],
        expiry_date: '2030-12-31',
        file_path: `${testUserId}/dl_front.jpg`,
        front_file_path: `${testUserId}/dl_front.jpg`,
        back_file_path: `${testUserId}/dl_back.jpg`,
        verification_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const auditSpy = vi.spyOn(driverRepository, 'createAuditLog').mockResolvedValue();
      const updateDriverSpy = vi.spyOn(driverRepository, 'updateDriver').mockResolvedValue({
        id: testDriverId,
        user_id: testUserId,
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
        profile_photo_path: `${testUserId}/selfie.jpg`,
        onboarding_status: 'submitted',
        rejection_reason: null,
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/v1/drivers/me/submit-for-review')
        .set(driverAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.driver.onboarding_status).toBe('submitted');
      expect(updateDriverSpy).toHaveBeenCalledWith(
        testDriverId,
        expect.objectContaining({
          onboarding_status: 'submitted',
        }),
      );
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DRIVER_ONBOARDING_SUBMITTED',
          entity_id: testDriverId,
        }),
      );
    });

    it('allows a previously rejected driver to fix details and resubmit', async () => {
      vi.spyOn(driverRepository, 'getDriverByUserId').mockResolvedValue({
        id: testDriverId,
        user_id: testUserId,
        driver_code: 'DRV-1001',
        verification_status: 'rejected',
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
        profile_photo_path: `${testUserId}/selfie_clean.jpg`,
        onboarding_status: 'rejected',
        rejection_reason: 'Blurry selfie photo',
        submitted_at: '2026-10-01T00:00:00Z',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(driverRepository, 'getProfileById').mockResolvedValue({
        id: testUserId,
        phone: '+919876543210',
        email: 'ramesh.kumar@driver.ryde.in',
        full_name: 'Ramesh Kumar',
        role: 'driver',
        account_status: 'active',
        phone_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(driverRepository, 'getIdentityDocumentByUserId').mockResolvedValue({
        id: 'id-doc-1',
        user_id: testUserId,
        document_type: 'aadhaar',
        masked_reference: 'XXXX-XXXX-1234',
        file_path: `${testUserId}/id_proof.jpg`,
        verification_status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        expiry_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(driverRepository, 'getDrivingLicenseByDriverId').mockResolvedValue({
        id: 'dl-1',
        driver_id: testDriverId,
        license_number_masked: 'KA01-XXXX-9871',
        license_classes: ['four_wheeler'],
        expiry_date: '2030-12-31',
        file_path: `${testUserId}/dl_front.jpg`,
        front_file_path: `${testUserId}/dl_front.jpg`,
        back_file_path: `${testUserId}/dl_back.jpg`,
        verification_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(driverRepository, 'updateDriver').mockResolvedValue({
        id: testDriverId,
        user_id: testUserId,
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
        profile_photo_path: `${testUserId}/selfie_clean.jpg`,
        onboarding_status: 'submitted',
        rejection_reason: null,
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/v1/drivers/me/submit-for-review')
        .set(driverAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.driver.onboarding_status).toBe('submitted');
    });

    it('fails submission if IdentityVerificationProvider flags document', async () => {
      vi.spyOn(driverRepository, 'getDriverByUserId').mockResolvedValue({
        id: testDriverId,
        user_id: testUserId,
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
        profile_photo_path: `${testUserId}/selfie.jpg`,
        onboarding_status: 'in_progress',
        rejection_reason: null,
        submitted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(driverRepository, 'getProfileById').mockResolvedValue({
        id: testUserId,
        phone: '+919876549999', // Phone ending with 9999 triggers mock KYC failure
        email: 'ramesh.kumar@driver.ryde.in',
        full_name: 'Ramesh Kumar',
        role: 'driver',
        account_status: 'active',
        phone_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(driverRepository, 'getIdentityDocumentByUserId').mockResolvedValue({
        id: 'id-doc-1',
        user_id: testUserId,
        document_type: 'aadhaar',
        masked_reference: 'XXXX-XXXX-1234',
        file_path: `${testUserId}/id_proof.jpg`,
        verification_status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        expiry_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      vi.spyOn(driverRepository, 'getDrivingLicenseByDriverId').mockResolvedValue({
        id: 'dl-1',
        driver_id: testDriverId,
        license_number_masked: 'KA01-XXXX-9871',
        license_classes: ['four_wheeler'],
        expiry_date: '2030-12-31',
        file_path: `${testUserId}/dl_front.jpg`,
        front_file_path: `${testUserId}/dl_front.jpg`,
        back_file_path: `${testUserId}/dl_back.jpg`,
        verification_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/v1/drivers/me/submit-for-review')
        .set(driverAuthHeader);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('verification failed');
    });
  });
});
