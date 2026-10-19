import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';

describe('Phase 5 Complete: All Core Modules Active & Route Fallbacks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(supabaseServiceClient.auth, 'getUser').mockResolvedValue({
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user: {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'test-driver@ryde.in',
          user_metadata: { role: 'driver' },
        } as any,
      },
      error: null,
    });
  });

  const authHeader = { Authorization: 'Bearer valid-test-token' };

  it('Unknown routes return 404 NOT_FOUND instead of unhandled 500', async () => {
    const res = await request(app).get('/api/v1/non-existent-route').set(authHeader);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
