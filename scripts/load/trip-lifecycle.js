// scripts/load/trip-lifecycle.js
// k6 Load Test: Full Trip Lifecycle under concurrent load
// Validates: heading_to_pickup -> arrived -> verify OTP -> handover -> in_progress -> complete -> earnings
// Targets: p95 < 300ms, Error rate < 1%

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

export const tripStepLatency = new Trend('trip_step_latency');
export const tripLifecycleErrors = new Rate('trip_lifecycle_error_rate');

export const options = {
  scenarios: {
    trip_lifecycle_flow: {
      executor: 'constant-vus',
      vus: 50,              // 50 concurrent trips progressing through state machine
      duration: '3m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<500'],
    trip_step_latency: ['p(95)<300'],
    trip_lifecycle_error_rate: ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:4000/api/v1';

export default function () {
  const tripId = `sim-trip-${__VU}-${__ITER}`;
  const token = __ENV.TEST_JWT_TOKEN || `driver-token-${__VU}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Request-Id': `k6-trip-${__VU}-${__ITER}`,
  };

  // Step 1: Heading to pickup
  let res = http.post(
    `${BASE_URL}/trips/${tripId}/heading-to-pickup`,
    JSON.stringify({ location: { latitude: 12.9716, longitude: 77.5946 } }),
    { headers, timeout: '5s' }
  );
  tripStepLatency.add(res.timings.duration);
  tripLifecycleErrors.add(res.status >= 500);

  sleep(0.5);

  // Step 2: Arrived at pickup
  res = http.post(
    `${BASE_URL}/trips/${tripId}/arrive`,
    JSON.stringify({ location: { latitude: 12.9718, longitude: 77.5948 } }),
    { headers, timeout: '5s' }
  );
  tripStepLatency.add(res.timings.duration);
  tripLifecycleErrors.add(res.status >= 500);

  sleep(0.5);

  // Step 3: Verify OTP
  res = http.post(
    `${BASE_URL}/trips/${tripId}/verify-otp`,
    JSON.stringify({ otp: '1234' }),
    { headers, timeout: '5s' }
  );
  tripStepLatency.add(res.timings.duration);
  tripLifecycleErrors.add(res.status >= 500);

  sleep(0.5);

  // Step 4: Vehicle Handover
  res = http.post(
    `${BASE_URL}/trips/${tripId}/handover`,
    JSON.stringify({ odometerBefore: 12050, fuelLevelBefore: 85.0 }),
    { headers, timeout: '5s' }
  );
  tripStepLatency.add(res.timings.duration);
  tripLifecycleErrors.add(res.status >= 500);

  sleep(0.5);

  // Step 5: Start Trip
  res = http.post(
    `${BASE_URL}/trips/${tripId}/start`,
    JSON.stringify({ location: { latitude: 12.972, longitude: 77.595 } }),
    { headers, timeout: '5s' }
  );
  tripStepLatency.add(res.timings.duration);
  tripLifecycleErrors.add(res.status >= 500);

  sleep(0.5);

  // Step 6: Complete Trip
  res = http.post(
    `${BASE_URL}/trips/${tripId}/complete`,
    JSON.stringify({
      dropLocation: { latitude: 12.9352, longitude: 77.6245 },
      distanceMeters: 6200,
      durationSeconds: 1100,
    }),
    { headers, timeout: '5s' }
  );
  tripStepLatency.add(res.timings.duration);
  tripLifecycleErrors.add(res.status >= 500);

  // Step 7: Check driver earnings summary
  res = http.get(`${BASE_URL}/earnings/summary`, { headers, timeout: '5s' });
  tripStepLatency.add(res.timings.duration);
  tripLifecycleErrors.add(res.status >= 500);

  sleep(1.0);
}
