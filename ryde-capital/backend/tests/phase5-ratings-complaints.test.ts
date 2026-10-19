import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';
import { tripsService } from '../src/modules/trips/service.js';
import { complaintsService } from '../src/modules/complaints/service.js';
import { BadRequestError, ConflictError } from '@ryde/shared';

describe('Phase 5: Ratings & Complaints', () => {
  const driverUserId = '22222222-2222-2222-2222-222222222222';
  const tripId = '33333333-3333-3333-3333-333333333333';
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

  describe('POST /api/v1/trips/:id/rating', () => {
    it('allows a driver to rate the customer on a completed trip', async () => {
      vi.spyOn(tripsService, 'rateCustomer').mockResolvedValueOnce({
        id: 'rating-1',
        trip_id: tripId,
        rating: 5,
        review: 'Very polite passenger and on time',
      });

      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/rating`)
        .set(authHeader)
        .send({
          rating: 5,
          review: 'Very polite passenger and on time',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);
    });

    it('rejects invalid rating values outside 1-5', async () => {
      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/rating`)
        .set(authHeader)
        .send({
          rating: 6,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('rejects rating if trip is not completed', async () => {
      vi.spyOn(tripsService, 'rateCustomer').mockRejectedValueOnce(
        new BadRequestError('Only completed trips can be rated'),
      );

      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/rating`)
        .set(authHeader)
        .send({
          rating: 4,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Only completed trips can be rated');
    });

    it('rejects duplicate rating on the same trip with 409 Conflict', async () => {
      vi.spyOn(tripsService, 'rateCustomer').mockRejectedValueOnce(
        new ConflictError('This trip has already been rated'),
      );

      const res = await request(app)
        .post(`/api/v1/trips/${tripId}/rating`)
        .set(authHeader)
        .send({
          rating: 5,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain('already been rated');
    });
  });

  describe('Complaints Endpoints', () => {
    it('files a complaint successfully', async () => {
      vi.spyOn(complaintsService, 'fileComplaint').mockResolvedValueOnce({
        id: 'complaint-1',
        trip_id: tripId,
        reported_by: driverUserId,
        complaint_type: 'fare_dispute',
        description: 'Toll fee was not included in passenger invoice',
        complaint_status: 'filed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/v1/complaints')
        .set(authHeader)
        .send({
          tripId,
          complaintType: 'fare_dispute',
          description: 'Toll fee was not included in passenger invoice',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.complaint_type).toBe('fare_dispute');
    });

    it('returns only own filed complaints', async () => {
      vi.spyOn(complaintsService, 'getComplaints').mockResolvedValueOnce({
        complaints: [
          {
            id: 'complaint-1',
            trip_id: tripId,
            reported_by: driverUserId,
            complaint_type: 'fare_dispute',
            description: 'Toll fee was not included in passenger invoice',
            complaint_status: 'filed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });

      const res = await request(app).get('/api/v1/complaints').set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.complaints).toHaveLength(1);
      expect(res.body.complaints[0].reported_by).toBe(driverUserId);
    });
  });
});
