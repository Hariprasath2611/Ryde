// scripts/load/telemetry-spike.js
// k6 Load Test: 1,000 Simulated Drivers sending location telemetry every 5 seconds
// Performance Targets: p95 < 300ms, Error Rate < 1%

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('telemetry_error_rate');
export const latencyTrend = new Trend('telemetry_p95_latency');
export const locationPingsCount = new Counter('telemetry_pings_total');

export const options = {
  scenarios: {
    telemetry_stream: {
      executor: 'ramping-vus',
      startVUs: 100,
      stages: [
        { duration: '30s', target: 500 },   // Warm-up ramp to 500 drivers
        { duration: '1m', target: 1000 },   // Peak 1,000 concurrent drivers
        { duration: '3m', target: 1000 },   // Sustained 1,000 drivers pinging every 5s
        { duration: '30s', target: 0 },      // Ramp down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // Master Prompt Targets: p95 < 300ms, error rate < 1%
    http_req_duration: ['p(95)<300', 'p(99)<600'],
    telemetry_p95_latency: ['p(95)<300'],
    telemetry_error_rate: ['rate<0.01'], // < 1% error rate
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:4000/api/v1';

// Base coordinates around Bangalore CBD
const BASE_LAT = 12.9716;
const BASE_LNG = 77.5946;

export default function () {
  const driverIndex = __VU;
  const token = __ENV.TEST_JWT_TOKEN || `simulated-driver-token-${driverIndex}`;

  // Small GPS wander
  const jitterLat = (Math.random() - 0.5) * 0.05;
  const jitterLng = (Math.random() - 0.5) * 0.05;

  const payload = JSON.stringify({
    location: {
      latitude: BASE_LAT + jitterLat,
      longitude: BASE_LNG + jitterLng,
    },
    heading: Math.floor(Math.random() * 360),
    speed: Math.floor(Math.random() * 60) + 10,
    accuracy: 5.0,
    recordedAt: new Date().toISOString(),
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Request-Id': `k6-ping-${__VU}-${__ITER}`,
    },
    timeout: '5s',
  };

  const res = http.post(`${BASE_URL}/drivers/me/location`, payload, params);

  const isSuccess = check(res, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'response has status ok': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'ok' || body.success === true || r.status === 200;
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!isSuccess);
  latencyTrend.add(res.timings.duration);
  locationPingsCount.add(1);

  // Each driver pings every 5 seconds (with ±0.5s jitter)
  sleep(4.5 + Math.random());
}
