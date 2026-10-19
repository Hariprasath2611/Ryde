// ryde-capital/backend/src/modules/trips/stateMachine.ts
// Phase 4: Trip State Machine Transition Table & Validator

import { ConflictError } from '@ryde/shared';

export type CanonicalTripStatus =
  | 'assigned'
  | 'heading_to_pickup'
  | 'arrived'
  | 'otp_verified'
  | 'handover_done'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_driver'
  | 'cancelled_by_customer'
  | 'cancelled_by_system';

/**
 * Normalizes legacy or aliased status strings to canonical Phase 4 states.
 */
export function normalizeTripStatus(status: string): CanonicalTripStatus {
  switch (status) {
    case 'dispatched':
      return 'assigned';
    case 'arrived_at_pickup':
      return 'arrived';
    case 'vehicle_handover_pending':
      return 'otp_verified';
    case 'started':
      return 'in_progress';
    case 'cancelled':
      return 'cancelled_by_system';
    default:
      return status as CanonicalTripStatus;
  }
}

/**
 * Transition Table:
 * Key: current canonical state
 * Value: array of permitted next canonical states
 */
export const TRIP_TRANSITION_TABLE: Record<CanonicalTripStatus, CanonicalTripStatus[]> = {
  assigned: [
    'heading_to_pickup',
    'cancelled_by_driver',
    'cancelled_by_customer',
    'cancelled_by_system',
  ],
  heading_to_pickup: [
    'arrived',
    'cancelled_by_driver',
    'cancelled_by_customer',
    'cancelled_by_system',
  ],
  arrived: [
    'otp_verified',
    'cancelled_by_driver',
    'cancelled_by_customer',
    'cancelled_by_system',
  ],
  otp_verified: [
    'handover_done',
    'cancelled_by_driver',
    'cancelled_by_customer',
    'cancelled_by_system',
  ],
  handover_done: [
    'in_progress',
    'cancelled_by_driver',
    'cancelled_by_customer',
    'cancelled_by_system',
  ],
  in_progress: [
    'completed',
  ],
  completed: [],
  cancelled_by_driver: [],
  cancelled_by_customer: [],
  cancelled_by_system: [],
};

/**
 * Returns true if a transition from currentStatus to nextStatus is allowed.
 */
export function isValidTransition(
  currentRawStatus: string,
  nextCanonicalStatus: CanonicalTripStatus,
): boolean {
  const current = normalizeTripStatus(currentRawStatus);
  const allowed = TRIP_TRANSITION_TABLE[current] || [];
  return allowed.includes(nextCanonicalStatus);
}

/**
 * Validates state transition; throws HTTP 409 Conflict if out of order.
 */
export function assertValidTransition(
  currentRawStatus: string,
  nextCanonicalStatus: CanonicalTripStatus,
): void {
  const current = normalizeTripStatus(currentRawStatus);
  if (!isValidTransition(current, nextCanonicalStatus)) {
    throw new ConflictError(
      `Cannot transition trip from status '${current}' to '${nextCanonicalStatus}'`,
      {
        currentStatus: current,
        requestedStatus: nextCanonicalStatus,
        allowedTransitions: TRIP_TRANSITION_TABLE[current] || [],
      },
    );
  }
}
