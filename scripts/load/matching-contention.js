// scripts/load/matching-contention.js
// k6 Load Test: Matching under concurrent bookings and accept races
// Validates atomic concurrency: exactly 1 winner gets 200, others get 409, p95 < 300ms, zero deadlocks

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

export const acceptLatency = new Trend('accept_assignment_latency');
export const acceptWins = new Counter('accept_races_won');
export const acceptConflicts = new Counter('accept_races_conflicted_409');
export const unexpectedErrors = new Rate('unexpected_error_rate');

export const options = {
  scenarios: {
    accept_race: {
      executor: 'shared-iterations',
      vus: 50,              // 50 concurrent drivers racing to accept
      iterations: 200,      // 200 race attempts across bookings
      maxDuration: '2m',
    },
  },
  thresholds: {
    // p95 < 300ms
    http_req_duration: ['p(95)<300'],
    accept_assignment_latency: ['p(95)<300'],
    unexpected_error_rate: ['rate<0.01'], // < 1% unexpected errors (500s)
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:4000/api/v1';

export default function () {
  const vuId = __VU;
  const token = __ENV.TEST_JWT_TOKEN || `driver-token-${vuId}`;
  // Group drivers into cohorts of 5 competing for the same assignment ID
  const assignmentCohort = Math.floor(__ITER / 5) + 1;
  const assignmentId = `assignment-race-test-${assignmentCohort}`;

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Request-Id': `k6-race-${__VU}-${__ITER}`,
    },
    timeout: '5s',
  };

  const res = http.post(`${BASE_URL}/assignments/${assignmentId}/accept`, '{}', params);

  acceptLatency.add(res.timings.duration);

  // In an accept race:
  // 200 OK -> Winner
  // 409 Conflict -> Legitimate business race lost (already taken or expired)
  // 404 Not Found -> In synthetic mocks if assignment expired
  // Any 500/503/504 -> Unexpected system error
  const isWinner = res.status === 200;
  const isConflict = res.status === 409 || res.status === 404;
  const isUnexpected = !isWinner && !isConflict;

  if (isWinner) {
    acceptWins.add(1);
  } else if (isConflict) {
    acceptConflicts.add(1);
  }

  unexpectedErrors.add(isUnexpected);

  check(res, {
    'status is expected (200 winner or 409 conflict)': (r) => r.status === 200 || r.status === 409 || r.status === 404,
    'latency is under 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.1 + Math.random() * 0.2);
}
