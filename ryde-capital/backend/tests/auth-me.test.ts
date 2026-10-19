import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';

describe('GET /api/v1/auth/me', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 UNAUTHORIZED when no token is provided', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(typeof res.body.error.message).toBe('string');
    expect(res.body.error.requestId).toBeDefined();
  });

  it('should return 401 UNAUTHORIZED when an invalid token is provided', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(supabaseServiceClient.auth, 'getUser').mockResolvedValueOnce({
      data: { user: null },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: { name: 'AuthApiError', message: 'invalid token', status: 401 } as any,
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with user id and role when a valid token is provided', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(supabaseServiceClient.auth, 'getUser').mockResolvedValueOnce({
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user: {
          id: 'driver-1234-uuid',
          email: 'driver@ryde.in',
          user_metadata: { role: 'driver' },
        } as any,
      },
      error: null,
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer valid-jwt-token');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('driver-1234-uuid');
    expect(res.body.role).toBe('driver');
    expect(res.body.email).toBe('driver@ryde.in');
  });
});
