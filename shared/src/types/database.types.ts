// shared/src/types/database.types.ts
// Generated Supabase TypeScript definitions for the Ryde Platform shared database

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

import type {
  UserRole,
  AccountStatus,
  VerificationStatus,
  VehicleType,
  AvailabilityStatus,
  BookingStatus,
  AssignmentStatus,
  TripStatus,
  PaymentStatus,
  SettlementStatus,
  SosStatus,
  ComplaintStatus,
} from '../constants/index.js';


export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone: string;
          email: string | null;
          full_name: string | null;
          role: UserRole;
          account_status: AccountStatus;
          phone_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone: string;
          email?: string | null;
          full_name?: string | null;
          role?: UserRole;
          account_status?: AccountStatus;
          phone_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          email?: string | null;
          full_name?: string | null;
          role?: UserRole;
          account_status?: AccountStatus;
          phone_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      identity_documents: {
        Row: {
          id: string;
          user_id: string;
          document_type: string;
          masked_reference: string;
          file_path: string;
          verification_status: VerificationStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          expiry_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_type: string;
          masked_reference: string;
          file_path: string;
          verification_status?: VerificationStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          expiry_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_type?: string;
          masked_reference?: string;
          file_path?: string;
          verification_status?: VerificationStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          expiry_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      emergency_contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string;
          relationship: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone: string;
          relationship?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string;
          relationship?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payment_accounts: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          payment_reference: string;
          verification_status: VerificationStatus;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          payment_reference: string;
          verification_status?: VerificationStatus;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          payment_reference?: string;
          verification_status?: VerificationStatus;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      device_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          platform?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          customer_code: string;
          verification_status: VerificationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          customer_code: string;
          verification_status?: VerificationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          customer_code?: string;
          verification_status?: VerificationStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          customer_id: string;
          vehicle_code: string;
          registration_number: string;
          make: string;
          model: string;
          vehicle_type: VehicleType;
          verification_status: VerificationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          vehicle_code: string;
          registration_number: string;
          make: string;
          model: string;
          vehicle_type: VehicleType;
          verification_status?: VerificationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          vehicle_code?: string;
          registration_number?: string;
          make?: string;
          model?: string;
          vehicle_type?: VehicleType;
          verification_status?: VerificationStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      vehicle_documents: {
        Row: {
          id: string;
          vehicle_id: string;
          document_type: string;
          file_path: string;
          verification_status: VerificationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          document_type: string;
          file_path: string;
          verification_status?: VerificationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          document_type?: string;
          file_path?: string;
          verification_status?: VerificationStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      drivers: {
        Row: {
          id: string;
          user_id: string;
          driver_code: string;
          verification_status: VerificationStatus;
          availability_status: AvailabilityStatus;
          allowed_vehicle_types: VehicleType[];
          rating_avg: number;
          rating_count: number;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          driver_code: string;
          verification_status?: VerificationStatus;
          availability_status?: AvailabilityStatus;
          allowed_vehicle_types?: VehicleType[];
          rating_avg?: number;
          rating_count?: number;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          driver_code?: string;
          verification_status?: VerificationStatus;
          availability_status?: AvailabilityStatus;
          allowed_vehicle_types?: VehicleType[];
          rating_avg?: number;
          rating_count?: number;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      driving_licenses: {
        Row: {
          id: string;
          driver_id: string;
          license_number_masked: string;
          license_classes: VehicleType[];
          expiry_date: string;
          file_path: string;
          verification_status: VerificationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          license_number_masked: string;
          license_classes: VehicleType[];
          expiry_date: string;
          file_path: string;
          verification_status?: VerificationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          driver_id?: string;
          license_number_masked?: string;
          license_classes?: VehicleType[];
          expiry_date?: string;
          file_path?: string;
          verification_status?: VerificationStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      driver_locations: {
        Row: {
          driver_id: string;
          location: unknown;
          heading: number | null;
          speed: number | null;
          updated_at: string;
        };
        Insert: {
          driver_id: string;
          location: unknown;
          heading?: number | null;
          speed?: number | null;
          updated_at?: string;
        };
        Update: {
          driver_id?: string;
          location?: unknown;
          heading?: number | null;
          speed?: number | null;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          customer_id: string;
          vehicle_id: string;
          pickup_location: unknown;
          pickup_address: string;
          destination_location: unknown;
          destination_address: string;
          booking_status: BookingStatus;
          estimated_fare: number;
          scheduled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          vehicle_id: string;
          pickup_location: unknown;
          pickup_address: string;
          destination_location: unknown;
          destination_address: string;
          booking_status?: BookingStatus;
          estimated_fare: number;
          scheduled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          vehicle_id?: string;
          pickup_location?: unknown;
          pickup_address?: string;
          destination_location?: unknown;
          destination_address?: string;
          booking_status?: BookingStatus;
          estimated_fare?: number;
          scheduled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      driver_assignments: {
        Row: {
          id: string;
          booking_id: string;
          driver_id: string;
          distance_to_customer_m: number | null;
          estimated_arrival_s: number | null;
          assignment_status: AssignmentStatus;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          driver_id: string;
          distance_to_customer_m?: number | null;
          estimated_arrival_s?: number | null;
          assignment_status?: AssignmentStatus;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          driver_id?: string;
          distance_to_customer_m?: number | null;
          estimated_arrival_s?: number | null;
          assignment_status?: AssignmentStatus;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          booking_id: string;
          customer_id: string;
          driver_id: string;
          vehicle_id: string;
          trip_status: TripStatus;
          distance_m: number | null;
          duration_s: number | null;
          final_fare: number | null;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          customer_id: string;
          driver_id: string;
          vehicle_id: string;
          trip_status?: TripStatus;
          distance_m?: number | null;
          duration_s?: number | null;
          final_fare?: number | null;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          customer_id?: string;
          driver_id?: string;
          vehicle_id?: string;
          trip_status?: TripStatus;
          distance_m?: number | null;
          duration_s?: number | null;
          final_fare?: number | null;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trip_otps: {
        Row: {
          id: string;
          trip_id: string;
          otp_hash: string;
          attempts: number;
          max_attempts: number;
          expires_at: string;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          otp_hash: string;
          attempts?: number;
          max_attempts?: number;
          expires_at: string;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          otp_hash?: string;
          attempts?: number;
          max_attempts?: number;
          expires_at?: string;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      vehicle_handovers: {
        Row: {
          id: string;
          trip_id: string;
          odometer_before: number | null;
          odometer_after: number | null;
          fuel_level_before: number | null;
          fuel_level_after: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          odometer_before?: number | null;
          odometer_after?: number | null;
          fuel_level_before?: number | null;
          fuel_level_after?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          odometer_before?: number | null;
          odometer_after?: number | null;
          fuel_level_before?: number | null;
          fuel_level_after?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      handover_photos: {
        Row: {
          id: string;
          handover_id: string;
          photo_type: string;
          file_path: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          handover_id: string;
          photo_type: string;
          file_path: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          handover_id?: string;
          photo_type?: string;
          file_path?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      trip_locations: {
        Row: {
          id: string;
          trip_id: string;
          driver_id: string;
          location: unknown;
          speed: number | null;
          recorded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          driver_id: string;
          location: unknown;
          speed?: number | null;
          recorded_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          driver_id?: string;
          location?: unknown;
          speed?: number | null;
          recorded_at?: string;
          created_at?: string;
        };
      };
      sos_events: {
        Row: {
          id: string;
          trip_id: string | null;
          triggered_by: string;
          location: unknown | null;
          sos_status: SosStatus;
          triggered_at: string;
          resolved_at: string | null;
          resolved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id?: string | null;
          triggered_by: string;
          location?: unknown | null;
          sos_status?: SosStatus;
          triggered_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string | null;
          triggered_by?: string;
          location?: unknown | null;
          sos_status?: SosStatus;
          triggered_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      fares: {
        Row: {
          id: string;
          trip_id: string;
          base_fare: number;
          distance_charge: number;
          time_charge: number;
          waiting_charge: number;
          platform_fee: number;
          tax: number;
          discount: number;
          total_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          base_fare?: number;
          distance_charge?: number;
          time_charge?: number;
          waiting_charge?: number;
          platform_fee?: number;
          tax?: number;
          discount?: number;
          total_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          base_fare?: number;
          distance_charge?: number;
          time_charge?: number;
          waiting_charge?: number;
          platform_fee?: number;
          tax?: number;
          discount?: number;
          total_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          trip_id: string;
          customer_id: string;
          amount: number;
          payment_method: string;
          payment_status: PaymentStatus;
          gateway_transaction_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          customer_id: string;
          amount: number;
          payment_method: string;
          payment_status?: PaymentStatus;
          gateway_transaction_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          customer_id?: string;
          amount?: number;
          payment_method?: string;
          payment_status?: PaymentStatus;
          gateway_transaction_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      driver_earnings: {
        Row: {
          id: string;
          driver_id: string;
          trip_id: string;
          gross_amount: number;
          platform_fee: number;
          net_amount: number;
          settlement_status: SettlementStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          trip_id: string;
          gross_amount?: number;
          platform_fee?: number;
          net_amount?: number;
          settlement_status?: SettlementStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          driver_id?: string;
          trip_id?: string;
          gross_amount?: number;
          platform_fee?: number;
          net_amount?: number;
          settlement_status?: SettlementStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      ratings: {
        Row: {
          id: string;
          trip_id: string;
          from_user_id: string;
          to_user_id: string;
          rating: number;
          review: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          from_user_id: string;
          to_user_id: string;
          rating: number;
          review?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          from_user_id?: string;
          to_user_id?: string;
          rating?: number;
          review?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      complaints: {
        Row: {
          id: string;
          trip_id: string | null;
          reported_by: string;
          complaint_type: string;
          description: string;
          complaint_status: ComplaintStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id?: string | null;
          reported_by: string;
          complaint_type: string;
          description: string;
          complaint_status?: ComplaintStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string | null;
          reported_by?: string;
          complaint_type?: string;
          description?: string;
          complaint_status?: ComplaintStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          notification_type: string;
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notification_type: string;
          title: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          notification_type?: string;
          title?: string;
          message?: string;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
    };
  };
}
