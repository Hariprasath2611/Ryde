import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { supabaseServiceClient } from '../src/config/supabase.js';

describe('Planned Future Module Stubs (Phase 4+): 501 Not Implemented', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Default valid auth user
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

  it('GET /api/v1/trips/:id returns 501 (Phase 4 Trip Execution)', async () => {
    const res = await request(app)
      .get('/api/v1/trips/11111111-1111-1111-1111-111111111111')
      .set(authHeader);
    expect(res.status).toBe(501);
    expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
  });

  it('GET /api/v1/earnings returns 501 (Phase 5 Driver Earnings & Settlement)', async () => {
    const res = await request(app).get('/api/v1/earnings').set(authHeader);
    expect(res.status).toBe(501);
    expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
  });

  it('GET /api/v1/emergency-contacts returns 501 (Phase 6 Safety & SOS)', async () => {
    const res = await request(app).get('/api/v1/emergency-contacts').set(authHeader);
    expect(res.status).toBe(501);
    expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
  });

  it('POST /api/v1/trips/:id/sos returns 501 (Phase 6 Safety & SOS)', async () => {
    const res = await request(app)
      .post('/api/v1/trips/11111111-1111-1111-1111-111111111111/sos')
      .set(authHeader)
      .send({ latitude: 12.9716, longitude: 77.5946 });
    expect(res.status).toBe(501);
    expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
  });
});
