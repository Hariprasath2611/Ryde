export const ROLES = {
  DRIVER: 'driver',
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  SUPPORT: 'support',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
export type UserRole = Role;

export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;

export type AccountStatus = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

export type VerificationStatus = (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

export const DRIVER_ONBOARDING_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type DriverOnboardingStatus =
  (typeof DRIVER_ONBOARDING_STATUS)[keyof typeof DRIVER_ONBOARDING_STATUS];

export const VEHICLE_TYPE = {
  TWO_WHEELER: 'two_wheeler',
  THREE_WHEELER: 'three_wheeler',
  FOUR_WHEELER: 'four_wheeler',
} as const;

export type VehicleType = (typeof VEHICLE_TYPE)[keyof typeof VEHICLE_TYPE];

export const AVAILABILITY_STATUS = {
  OFFLINE: 'offline',
  ONLINE: 'online',
  ON_TRIP: 'on_trip',
} as const;

export type AvailabilityStatus = (typeof AVAILABILITY_STATUS)[keyof typeof AVAILABILITY_STATUS];

export const BOOKING_STATUS = {
  PENDING: 'pending',
  SEARCHING: 'searching',
  ASSIGNED: 'assigned',
  DRIVER_ASSIGNED: 'driver_assigned',
  DRIVER_ARRIVED: 'driver_arrived',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_DRIVER_FOUND: 'no_driver_found',
} as const;

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const ASSIGNMENT_STATUS = {
  OFFERED: 'offered',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUS)[keyof typeof ASSIGNMENT_STATUS];

export const TRIP_STATUS = {
  ASSIGNED: 'assigned',
  HEADING_TO_PICKUP: 'heading_to_pickup',
  ARRIVED: 'arrived',
  OTP_VERIFIED: 'otp_verified',
  HANDOVER_DONE: 'handover_done',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED_BY_DRIVER: 'cancelled_by_driver',
  CANCELLED_BY_CUSTOMER: 'cancelled_by_customer',
  CANCELLED_BY_SYSTEM: 'cancelled_by_system',
  // Backward-compatible legacy aliases
  DISPATCHED: 'dispatched',
  ARRIVED_AT_PICKUP: 'arrived_at_pickup',
  VEHICLE_HANDOVER_PENDING: 'vehicle_handover_pending',
  STARTED: 'started',
  CANCELLED: 'cancelled',
} as const;

export type TripStatus = (typeof TRIP_STATUS)[keyof typeof TRIP_STATUS];

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const SETTLEMENT_STATUS = {
  PENDING: 'pending',
  PROCESSED: 'processed',
  FAILED: 'failed',
} as const;

export type SettlementStatus = (typeof SETTLEMENT_STATUS)[keyof typeof SETTLEMENT_STATUS];

export const SOS_STATUS = {
  TRIGGERED: 'triggered',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
  FALSE_ALARM: 'false_alarm',
} as const;

export type SosStatus = (typeof SOS_STATUS)[keyof typeof SOS_STATUS];

export const COMPLAINT_STATUS = {
  FILED: 'filed',
  UNDER_INVESTIGATION: 'under_investigation',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUS)[keyof typeof COMPLAINT_STATUS];
