// ryde-capital/backend/tests/phase6-security-dpdp.test.ts
// Integration tests for Phase 6 Security Hardening, Deep Readiness, and DPDP Act Privacy Endpoints

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';

describe('Phase 6: Security, Readiness Probes & DPDP Act Privacy Compliance', () => {
  const mockDriverId = 'd0000000-0000-4000-8000-000000000001';
  const mockUserId = 'u0000000-0000-4000-8000-000000000001';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Deep Health & Readiness Probes', () => {
    it('GET /api/v1/health returns status ok, uptime, and version', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(typeof res.body.uptime).toBe('number');
      expect(res.body.version).toBe('0.1.0');
    });

    it('GET /api/v1/health/readiness returns healthy when database is reachable', async () => {
      // Mock supabaseServiceClient.from('profiles').select(...)
      vi.spyOn(supabaseServiceClient, 'from').mockReturnValue({
        select: vi.fn().mockResolvedValue({ count: 10, error: null }),
      } as any);

      const res = await request(app).get('/api/v1/health/readiness');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database).toBe('connected');
      expect(typeof res.body.dbLatencyMs).toBe('number');
    });

    it('GET /api/v1/app/version returns semver constraints for force update', async () => {
      const res = await request(app).get('/api/v1/app/version?platform=android');
      expect(res.status).toBe(200);
      expect(res.body.platform).toBe('android');
      expect(res.body.minVersion).toBeDefined();
      expect(res.body.latestVersion).toBeDefined();
      expect(res.body.forceUpdateRequired).toBe(false);
    });
  });

  describe('DPDP Act: Driver Consent Management', () => {
    it('POST /api/v1/drivers/me/consent records explicit consent', async () => {
      vi.spyOn(supabaseServiceClient.auth, 'getUser').mockResolvedValue({
        data: {
          user: {
            id: mockUserId,
            phone: '+919876543210',
            app_metadata: { role: 'driver' },
            user_metadata: {},
          } as any,
        },
        error: null,
      });

      // Mock driver fetch
      const fromSpy = vi.spyOn(supabaseServiceClient, 'from').mockImplementation((table: string) => {
        if (table === 'drivers') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: mockDriverId, user_id: mockUserId, onboarding_status: 'approved' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'driver_consent_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      const res = await request(app)
        .post('/api/v1/drivers/me/consent')
        .set('Authorization', 'Bearer valid-driver-token')
        .send({
          purpose: 'location_telemetry',
          consentVersion: 'v1.0',
          isGranted: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.purpose).toBe('location_telemetry');
    });
  });

  describe('DPDP Act: Account Deletion (Right to Erasure with 30-day grace period)', () => {
    it('DELETE /api/v1/drivers/me schedules deletion and sets driver offline', async () => {
      vi.spyOn(supabaseServiceClient.auth, 'getUser').mockResolvedValue({
        data: {
          user: {
            id: mockUserId,
            phone: '+919876543210',
            app_metadata: { role: 'driver' },
            user_metadata: {},
          } as any,
        },
        error: null,
      });

      const scheduledDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      vi.spyOn(supabaseServiceClient, 'from').mockImplementation((table: string) => {
        if (table === 'drivers') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: mockDriverId, user_id: mockUserId, availability_status: 'online' },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as any;
        }
        if (table === 'account_deletion_requests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'del-req-123',
                    scheduled_deletion_at: scheduledDate,
                    status: 'pending_grace_period',
                  },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      const res = await request(app)
        .delete('/api/v1/drivers/me')
        .set('Authorization', 'Bearer valid-driver-token')
        .send({
          reason: 'Switching to another platform',
        });

      expect(res.status).toBe(200);
      expect(res.body.gracePeriodDays).toBe(30);
      expect(res.body.status).toBe('pending_grace_period');
      expect(res.body.scheduledDeletionAt).toBeDefined();
    });

    it('POST /api/v1/drivers/me/cancel-deletion restores account during grace period', async () => {
      vi.spyOn(supabaseServiceClient.auth, 'getUser').mockResolvedValue({
        data: {
          user: {
            id: mockUserId,
            phone: '+919876543210',
            app_metadata: { role: 'driver' },
            user_metadata: {},
          } as any,
        },
        error: null,
      });

      vi.spyOn(supabaseServiceClient, 'from').mockImplementation((table: string) => {
        if (table === 'drivers') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: mockDriverId, user_id: mockUserId },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as any;
        }
        if (table === 'account_deletion_requests') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockResolvedValue({ data: [{ id: 'del-123' }], error: null }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      const res = await request(app)
        .post('/api/v1/drivers/me/cancel-deletion')
        .set('Authorization', 'Bearer valid-driver-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('cancelled successfully');
    });
  });

  describe('DPDP Act: Data Export (Right to Portability)', () => {
    it('GET /api/v1/drivers/me/export returns full structured personal data with statutory disclaimer', async () => {
      vi.spyOn(supabaseServiceClient.auth, 'getUser').mockResolvedValue({
        data: {
          user: {
            id: mockUserId,
            phone: '+919876543210',
            app_metadata: { role: 'driver' },
            user_metadata: {},
          } as any,
        },
        error: null,
      });

      vi.spyOn(supabaseServiceClient, 'from').mockImplementation((table: string) => {
        if (table === 'drivers') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: mockDriverId, user_id: mockUserId },
                  error: null,
                }),
                single: vi.fn().mockResolvedValue({
                  data: { id: mockDriverId, driver_code: 'DRV-123' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockUserId, full_name: 'Test Driver', phone_number: '+919876543210' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        } as any;
      });

      const res = await request(app)
        .get('/api/v1/drivers/me/export')
        .set('Authorization', 'Bearer valid-driver-token');

      expect(res.status).toBe(200);
      expect(res.body.exportMetadata).toBeDefined();
      expect(res.body.exportMetadata.compliance).toContain('DPDP');
      expect(res.body.exportMetadata.legalDisclaimer).toContain('Legal review is required');
      expect(res.body.driverDetails).toBeDefined();
    });
  });
});
