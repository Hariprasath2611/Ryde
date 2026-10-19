import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';
import { notificationsService } from '../src/modules/notifications/service.js';

describe('Phase 5: In-App and Push Notifications', () => {
  const driverUserId = '22222222-2222-2222-2222-222222222222';
  const authHeader = { Authorization: 'Bearer valid-driver-jwt' };

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
  });

  describe('In-App Notifications', () => {
    it('GET /api/v1/notifications returns notifications list and unread count', async () => {
      vi.spyOn(notificationsService, 'getNotifications').mockResolvedValueOnce({
        notifications: [
          {
            id: 'notif-1',
            user_id: driverUserId,
            title: 'New Offer Available',
            body: 'Pickup at MG Road',
            notification_type: 'new_offer',
            data: { assignmentId: 'asg-1' },
            read_at: null,
            created_at: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

      const res = await request(app).get('/api/v1/notifications').set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.notifications).toHaveLength(1);
      expect(res.body.unreadCount).toBe(1);
    });

    it('PATCH /api/v1/notifications/:id/read marks notification as read', async () => {
      const notifId = '55555555-5555-5555-5555-555555555555';
      vi.spyOn(notificationsService, 'markAsRead').mockResolvedValueOnce({
        success: true,
        message: 'Notification marked as read',
      });

      const res = await request(app)
        .patch(`/api/v1/notifications/${notifId}/read`)
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/v1/notifications/read-all marks all unread notifications as read', async () => {
      vi.spyOn(notificationsService, 'markAllAsRead').mockResolvedValueOnce({
        success: true,
        count: 5,
        message: 'All notifications marked as read',
      });

      const res = await request(app)
        .post('/api/v1/notifications/read-all')
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(5);
    });
  });

  describe('Push Notifications & Device Token Registration', () => {
    it('POST /api/v1/notifications/device-token registers Expo push token', async () => {
      vi.spyOn(notificationsService, 'registerDeviceToken').mockResolvedValueOnce({
        success: true,
        message: 'Device token registered successfully',
      });

      const res = await request(app)
        .post('/api/v1/notifications/device-token')
        .set(authHeader)
        .send({
          token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
          platform: 'android',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('rejects empty or invalid device token', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/device-token')
        .set(authHeader)
        .send({
          token: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });
  });
});
