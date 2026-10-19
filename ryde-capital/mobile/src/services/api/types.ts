/**
 * API Type Definitions for Ryde Capital
 */

export type TripState =
  | 'offered'
  | 'assigned'
  | 'heading_to_pickup'
  | 'arrived'
  | 'otp_verified'
  | 'handover_done'
  | 'in_progress'
  | 'reached'
  | 'completed'
  | 'cancelled_by_driver'
  | 'cancelled_by_customer'
  | 'cancelled_by_system';

export type OnboardingStatus = 'pending' | 'review' | 'rejected' | 'approved';

export interface DriverProfile {
  id: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
  rating: number;
  totalTrips: number;
  status: OnboardingStatus;
  rejectionReason?: string;
  vehicleTypes: Array<'two_wheeler' | 'three_wheeler' | 'four_wheeler'>;
  documentsVerified: boolean;
}

export interface RideOffer {
  id: string;
  fare: number;
  expiresAt: string; // ISO
  totalDurationSeconds: number;
  customer: {
    firstName: string;
    rating: number;
    phone?: string;
  };
  vehicle: {
    type: 'two_wheeler' | 'three_wheeler' | 'four_wheeler';
    label: string;
  };
  pickup: {
    address: string;
    distanceKm: number;
    latitude: number;
    longitude: number;
    etaMinutes: number;
  };
  drop: {
    address: string;
    distanceKm: number;
    latitude: number;
    longitude: number;
    durationMinutes: number;
  };
}

export interface TripRecord {
  id: string;
  state: TripState;
  customer: {
    firstName: string;
    rating: number;
    phone: string;
  };
  vehicle: {
    type: 'two_wheeler' | 'three_wheeler' | 'four_wheeler';
    label: string;
  };
  pickup: {
    address: string;
    distanceKm: number;
    latitude: number;
    longitude: number;
  };
  drop: {
    address: string;
    distanceKm: number;
    latitude: number;
    longitude: number;
  };
  fare: number;
  driverEarnings: number;
  platformFee: number;
  distanceKm: number;
  durationMinutes: number;
  startOdometer?: number;
  endOdometer?: number;
  startFuelLevel?: string;
  endFuelLevel?: string;
  createdAt: string;
  completedAt?: string;
}

export interface EarningsSummary {
  period: 'today' | 'week' | 'month';
  totalEarnings: number;
  tripsCount: number;
  onlineTimeFormatted: string;
  dailySeries: Array<{ label: string; value: number; isCurrent?: boolean }>;
  recentTrips: Array<{
    id: string;
    time: string;
    location: string;
    amount: number;
  }>;
}

export interface PayoutAccount {
  type: 'upi' | 'bank_account';
  upiId?: string;
  accountNumber?: string;
  ifsc?: string;
  isDefault: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: 'approval' | 'payout' | 'rate' | 'reminder';
  createdAt: string;
}
