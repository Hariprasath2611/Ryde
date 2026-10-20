export type ScreenType =
  | 'splash'
  | 'registration'
  | 'otp'
  | 'verification'
  | 'dashboard'
  | 'new_bookings'
  | 'workflow_accepted'
  | 'workflow_pickup'
  | 'workflow_arrived'
  | 'workflow_customer_otp'
  | 'workflow_vehicle_handover'
  | 'workflow_start_trip'
  | 'workflow_active_trip'
  | 'workflow_destination_reached'
  | 'workflow_final_handover'
  | 'workflow_end_trip'
  | 'workflow_earnings'
  | 'workflow_feedback';

export type BottomNavTab = 'home' | 'bookings' | 'trips';

export interface DriverProfile {
  fullName: string;
  mobileNumber: string;
  countryCode: string;
  avatarUrl: string;
  aadharNumber: string;
  licenseFile: string | null;
  licenseFileName?: string;
  isVerified: boolean;
  isOnline: boolean;
  rating: number;
  totalTripsToday: number;
  todayEarnings: number;
}

export interface BookingRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  customerRating: number;
  pickupLocation: string;
  destination: string;
  pickupTime: string;
  vehicleType: string;
  vehicleModel: string;
  vehicleRegNumber: string;
  estimatedFare: number;
  distance: string;
  estimatedDuration: string;
  customerOtp: string;
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed';
}

export interface RecentTrip {
  id: string;
  route: string;
  pickupLocation: string;
  destination: string;
  fare: number;
  status: 'Done' | 'Cancelled';
  date: string;
  time: string;
  vehicle: string;
  customerName: string;
}

export interface VehicleHandoverData {
  fuelLevel: number; // percentage 0-100
  odometerReading: string;
  odometerPhoto: string | null;
  frontPhoto: string | null;
  rearPhoto: string | null;
  interiorPhoto: string | null;
  existingScratchesChecked: boolean;
  acWorking: boolean;
  cleanlinessChecked: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}
