import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';
import { safetyService } from '../src/modules/safety/service.js';
import { BadRequestError, NotFoundError } from '@ryde/shared';

describe('Phase 5: Safety, Emergency Contacts, SOS & Live Trip Sharing', () => {
  const driverUserId = '22222222-2222-2222-2222-222222222222';
  const adminUserId = '99999999-9999-9999-9999-999999999999';
  const tripId = '33333333-3333-3333-3333-333333333333';
  const contactId = '44444444-4444-4444-4444-444444444444';
  const sosId = '55555555-5555-5555-5555-555555555555';
  const shareToken = '1234567890abcdef1234567890abcdef';

  const driverAuthHeader = { Authorization: 'Bearer driver-token' };
  const adminAuthHeader = { Authorization: 'Bearer admin-token' };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(supabaseServiceClient.auth, 'getUser').mockImplementation(async (token: string) => {
      if (token === 'admin-token') {
        return {
          data: {
            user: {
              id: adminUserId,
              email: 'admin@ryde.in',
              user_metadata: { role: 'admin' },
            } as any,
          },
          error: null,
        };
      }
      return {
        data: {
          user: {
            id: driverUserId,
            email: 'driver@ryde.in',
            user_metadata: { role: 'driver' },
          } as any,
        },
        error: null,
      };
    });
  });

  describe('Emergency Contacts CRUD', () => {
    it('GET /api/v1/emergency-contacts lists contacts', async () => {
      vi.spyOn(safetyService, 'getEmergencyContacts').mockResolvedValueOnce([
        {
          id: contactId,
          user_id: driverUserId,
          name: 'Priya Sharma',
          phone: '+919876543210',
          relationship: 'Spouse',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const res = await request(app).get('/api/v1/emergency-contacts').set(driverAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].phone).toBe('+919876543210');
    });

    it('POST /api/v1/emergency-contacts validates phone and adds contact', async () => {
      vi.spyOn(safetyService, 'createEmergencyContact').mockResolvedValueOnce({
        id: contactId,
        user_id: driverUserId,
        name: 'Priya Sharma',
        phone: '+919876543210',
        relationship: 'Spouse',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/v1/emergency-contacts')
        .set(driverAuthHeader)
        .send({
          name: 'Priya Sharma',
          relationship: 'Spouse',
          phone: '+919876543210',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Priya Sharma');
    });

    it('POST /api/v1/emergency-contacts rejects invalid phone format', async () => {
      const res = await request(app)
        .post('/api/v1/emergency-contacts')
        .set(driverAuthHeader)
        .send({
          name: 'Priya Sharma',
          relationship: 'Spouse',
          phone: '1234',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('enforces maximum 5 emergency contacts limit', async () => {
      vi.spyOn(safetyService, 'createEmergencyContact').mockRejectedValueOnce(
        new BadRequestError('Maximum limit of 5 emergency contacts reached'),
      );

      const res = await request(app)
        .post('/api/v1/emergency-contacts')
        .set(driverAuthHeader)
        .send({
          name: 'Sixth Contact',
          relationship: 'Friend',
          phone: '+919876543219',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Maximum limit of 5');
    });

    it('DELETE /api/v1/emergency-contacts/:id deletes contact', async () => {
      vi.spyOn(safetyService, 'deleteEmergencyContact').mockResolvedValueOnce({
        success: true,
        message: 'Emergency contact removed successfully',
      });

      const res = await request(app)
        .delete(`/api/v1/emergency-contacts/${contactId}`)
        .set(driverAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('SOS Flow (Trigger, Deduplication & Cancel)', () => {
    it('POST /api/v1/trips/:id/sos reverse geocodes, alerts contacts, and returns 201', async () => {
      vi.spyOn(safetyService, 'triggerTripSos').mockResolvedValueOnce({
        event: {
          id: sosId,
          trip_id: tripId,
          triggered_by: driverUserId,
          location: 'POINT(77.5946 12.9716)',
          sos_status: 'triggered',
          reverse_geocoded_address: 'MG Road, Bengaluru',
          notes: 'Driver SOS',
          acknowledged_at: null,
          acknowledged_by: null,
          triggered_at: new Date().toISOString(),
          resolved_at: null,
          resolved_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        deduped: false,
        emergencyContactsNotified: 2,
        reverseGeocodedAddress: 'MG Road, Bengaluru',
      });

      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/sos`)
        .set(driverAuthHeader)
        .send({
          latitude: 12.9716,
          longitude: 77.5946,
          reason: 'Suspicious emergency situation',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.deduped).toBe(false);
      expect(res.body.data.emergencyContactsNotified).toBe(2);
      expect(res.body.data.reverseGeocodedAddress).toBe('MG Road, Bengaluru');
    });

    it('deduplicates repeated SOS triggers within the window and returns 200', async () => {
      vi.spyOn(safetyService, 'triggerTripSos').mockResolvedValueOnce({
        event: {
          id: sosId,
          trip_id: tripId,
          triggered_by: driverUserId,
          location: 'POINT(77.5946 12.9716)',
          sos_status: 'triggered',
          reverse_geocoded_address: 'MG Road, Bengaluru',
          notes: 'Driver SOS',
          acknowledged_at: null,
          acknowledged_by: null,
          triggered_at: new Date().toISOString(),
          resolved_at: null,
          resolved_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        deduped: true,
        message: 'An active SOS alert was already submitted recently for this trip.',
      });

      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/sos`)
        .set(driverAuthHeader)
        .send({
          latitude: 12.9716,
          longitude: 77.5946,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.deduped).toBe(true);
    });

    it('POST /api/v1/sos/:id/cancel cancels false alarm and retains record', async () => {
      vi.spyOn(safetyService, 'cancelTripSos').mockResolvedValueOnce({
        success: true,
        event: {
          id: sosId,
          trip_id: tripId,
          triggered_by: driverUserId,
          location: 'POINT(77.5946 12.9716)',
          sos_status: 'cancelled',
          reverse_geocoded_address: 'MG Road, Bengaluru',
          notes: 'Pressed accidentally',
          acknowledged_at: null,
          acknowledged_by: null,
          triggered_at: new Date().toISOString(),
          resolved_at: new Date().toISOString(),
          resolved_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        message: 'SOS emergency alert has been cancelled as a false alarm',
      });

      const res = await request(app)
        .post(`/api/v1/sos/${sosId}/cancel`)
        .set(driverAuthHeader)
        .send({ reason: 'Pressed accidentally' });

      expect(res.status).toBe(200);
      expect(res.body.event.sos_status).toBe('cancelled');
    });
  });

  describe('Live Trip Sharing & Data-Minimized Public Tracking', () => {
    it('POST /api/v1/trips/:id/share generates time-limited share token', async () => {
      vi.spyOn(safetyService, 'createTripShare').mockResolvedValueOnce({
        shareToken,
        shareUrl: `/public/track/${shareToken}`,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/share`)
        .set(driverAuthHeader);

      expect(res.status).toBe(201);
      expect(res.body.data.shareToken).toBe(shareToken);
    });

    it('GET /public/track/:token is unauthenticated and strictly adheres to data minimization', async () => {
      vi.spyOn(safetyService, 'getPublicTrackingData').mockResolvedValueOnce({
        tripId,
        tripStatus: 'in_progress',
        driverFirstName: 'Rajesh',
        customerFirstName: 'Aarav',
        vehicleType: 'sedan',
        liveLocation: { latitude: 12.9716, longitude: 77.5946, heading: 45 },
        pickupAddress: 'Indiranagar 100ft Rd',
        destinationAddress: 'Koramangala 5th Block',
        etaMinutes: 14,
      });

      const res = await request(app).get(`/public/track/${shareToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.driverFirstName).toBe('Rajesh');
      expect(data.customerFirstName).toBe('Aarav');
      expect(data.vehicleType).toBe('sedan');
      expect(data.etaMinutes).toBe(14);

      // Verify ZERO sensitive leakage:
      expect(data).not.toHaveProperty('phone');
      expect(data).not.toHaveProperty('phoneNumber');
      expect(data).not.toHaveProperty('driverPhone');
      expect(data).not.toHaveProperty('licensePlate');
      expect(data).not.toHaveProperty('registrationNumber');
      expect(data).not.toHaveProperty('driverFullName');
    });

    it('GET /public/track/:token dies when the trip has ended', async () => {
      vi.spyOn(safetyService, 'getPublicTrackingData').mockRejectedValueOnce(
        new NotFoundError('This trip has concluded. Live tracking is no longer active.'),
      );

      const res = await request(app).get(`/public/track/${shareToken}`);
      expect(res.status).toBe(404);
      expect(res.body.error.message).toContain('trip has concluded');
    });

    it('GET /public/track/:token/view renders HTML tracking page', async () => {
      vi.spyOn(safetyService, 'getPublicTrackingData').mockResolvedValueOnce({
        tripId,
        tripStatus: 'in_progress',
        driverFirstName: 'Rajesh',
        customerFirstName: 'Aarav',
        vehicleType: 'sedan',
        liveLocation: { latitude: 12.9716, longitude: 77.5946, heading: 45 },
        destinationAddress: 'Koramangala 5th Block',
        etaMinutes: 14,
      } as any);

      const res = await request(app).get(`/public/track/${shareToken}/view`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('Ryde Live Track');
      expect(res.text).toContain('Rajesh');
    });
  });

  describe('Admin SOS Endpoints', () => {
    it('GET /api/v1/admin/sos lists open SOS events for admin/support', async () => {
      vi.spyOn(safetyService, 'listOpenSos').mockResolvedValueOnce([
        {
          id: sosId,
          trip_id: tripId,
          triggered_by: driverUserId,
          location: 'POINT(77.5946 12.9716)',
          sos_status: 'triggered',
          reverse_geocoded_address: 'MG Road, Bengaluru',
          notes: 'Driver SOS',
          acknowledged_at: null,
          acknowledged_by: null,
          triggered_at: new Date().toISOString(),
          resolved_at: null,
          resolved_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          driver_name: 'Rajesh Kumar',
          driver_phone: '+919876543210',
        },
      ]);

      const res = await request(app).get('/api/v1/admin/sos').set(adminAuthHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].driver_name).toBe('Rajesh Kumar');
    });

    it('POST /api/v1/admin/sos/:id/acknowledge acknowledges SOS', async () => {
      vi.spyOn(safetyService, 'acknowledgeSos').mockResolvedValueOnce({
        id: sosId,
        trip_id: tripId,
        triggered_by: driverUserId,
        location: 'POINT(77.5946 12.9716)',
        sos_status: 'investigating',
        reverse_geocoded_address: 'MG Road',
        notes: 'Dispatching patrol',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: adminUserId,
        triggered_at: new Date().toISOString(),
        resolved_at: null,
        resolved_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post(`/api/v1/admin/sos/${sosId}/acknowledge`)
        .set(adminAuthHeader)
        .send({ notes: 'Dispatching patrol' });

      expect(res.status).toBe(200);
      expect(res.body.data.sos_status).toBe('investigating');
    });

    it('POST /api/v1/admin/sos/:id/resolve resolves SOS with notes', async () => {
      vi.spyOn(safetyService, 'resolveSos').mockResolvedValueOnce({
        id: sosId,
        trip_id: tripId,
        triggered_by: driverUserId,
        location: 'POINT(77.5946 12.9716)',
        sos_status: 'resolved',
        reverse_geocoded_address: 'MG Road',
        notes: 'Resolved with police escort',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: adminUserId,
        triggered_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
        resolved_by: adminUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post(`/api/v1/admin/sos/${sosId}/resolve`)
        .set(adminAuthHeader)
        .send({ notes: 'Resolved with police escort' });

      expect(res.status).toBe(200);
      expect(res.body.data.sos_status).toBe('resolved');
    });
  });
});
