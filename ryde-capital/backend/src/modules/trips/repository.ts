// ryde-capital/backend/src/modules/trips/repository.ts
// Phase 4 Trips Repository: Database Access for State Mutations, Handover, Telemetry & Fares

import { supabaseServiceClient } from '../../config/supabase.js';
import type { Database, FareRule, FareBreakdown } from '@ryde/shared';

export type TripRow = Database['public']['Tables']['trips']['Row'];
export type DriverRow = Database['public']['Tables']['drivers']['Row'];
export type BookingRow = Database['public']['Tables']['bookings']['Row'];

export interface TripDetailed extends TripRow {
  booking?: {
    id: string;
    pickup_address: string;
    pickup_location: unknown;
    destination_address: string;
    destination_location: unknown;
    estimated_fare: number;
    booking_status: string;
    vehicle_type?: string;
  } | null;
  vehicle?: {
    id: string;
    make: string;
    model: string;
    year: number;
    license_plate: string;
    vehicle_type: string;
  } | null;
  customer?: {
    id: string;
    full_name: string;
    phone?: string;
  } | null;
  handover?: {
    id: string;
    odometer_before: number | null;
    odometer_after: number | null;
    fuel_level_before: number | null;
    fuel_level_after: number | null;
    notes: string | null;
    existing_damage_notes: string | null;
    return_notes: string | null;
    photos?: Array<{ photo_type: string; file_path: string }>;
  } | null;
  fare?: {
    base_fare: number;
    distance_charge: number;
    time_charge: number;
    waiting_charge: number;
    platform_fee: number;
    tax: number;
    total_amount: number;
  } | null;
}

export interface ITripsRepository {
  getDriverByUserId(userId: string): Promise<DriverRow | null>;
  getTripById(tripId: string): Promise<TripRow | null>;
  getTripForUpdate(tripId: string): Promise<TripRow | null>;
  getTripDetails(tripId: string): Promise<TripDetailed | null>;
  listDriverTrips(
    driverId: string,
    limit: number,
    offset: number,
    status?: string,
  ): Promise<{ trips: TripDetailed[]; total: number }>;
  updateTripStatus(
    tripId: string,
    status: string,
    updates?: Record<string, unknown>,
  ): Promise<TripRow>;
  getDriverLatestLocation(
    driverId: string,
  ): Promise<{ latitude: number; longitude: number; recorded_at: string } | null>;
  getTripBreadcrumbs(
    tripId: string,
  ): Promise<Array<{ latitude: number; longitude: number; speed: number | null; recorded_at: string }>>;
  getTripOtp(
    tripId: string,
  ): Promise<{
    otp_hash: string;
    attempts: number;
    max_attempts: number;
    expires_at: string;
    last_generated_at: string | null;
    locked_out_at: string | null;
    verified_at: string | null;
  } | null>;
  upsertTripOtp(
    tripId: string,
    otpHash: string,
    expiresAt: string,
    lastGeneratedAt: string,
  ): Promise<void>;
  incrementOtpAttempts(
    tripId: string,
    attempts: number,
    lockedOutAt?: string | null,
  ): Promise<void>;
  markOtpVerified(tripId: string): Promise<void>;
  writeOtpToOutbox(
    tripId: string,
    otpCode: string,
    expiresAt: string,
  ): Promise<void>;
  createVehicleHandover(data: {
    trip_id: string;
    odometer_before: number;
    fuel_level_before: number;
    notes?: string;
    existing_damage_notes?: string;
  }): Promise<string>;
  insertHandoverPhotos(
    photos: Array<{ handover_id: string; photo_type: string; file_path: string }>,
  ): Promise<void>;
  updateVehicleHandoverReturn(
    tripId: string,
    data: { odometer_after: number; fuel_level_after?: number; return_notes?: string },
  ): Promise<void>;
  getFareRule(vehicleType: string): Promise<FareRule | null>;
  recordTripFareAndPayment(
    tripId: string,
    customerId: string,
    driverId: string,
    fare: FareBreakdown,
    transactionId: string,
  ): Promise<void>;
  getIdempotentResponse(
    key: string,
  ): Promise<{ response_status: number; response_body: unknown } | null>;
  saveIdempotentResponse(
    key: string,
    targetResource: string,
    responseStatus: number,
    responseBody: unknown,
  ): Promise<void>;
  getCustomerContact(
    tripId: string,
  ): Promise<{ customerId: string; customerName: string; phone: string } | null>;
  cancelStaleWaitingTrips(
    timeoutMinutes: number,
  ): Promise<Array<{ trip_id: string; driver_id: string; booking_id: string }>>;
}

export class TripsRepository implements ITripsRepository {
  async getDriverByUserId(userId: string): Promise<DriverRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('drivers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getTripById(tripId: string): Promise<TripRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getTripForUpdate(tripId: string): Promise<TripRow | null> {
    // In PostgreSQL / Supabase, simple single-row update with matching ID acts atomically with row lock
    const { data, error } = await supabaseServiceClient
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getTripDetails(tripId: string): Promise<TripDetailed | null> {
    const { data: trip, error: tripErr } = await supabaseServiceClient
      .from('trips')
      .select(`
        *,
        booking:bookings(id, pickup_address, pickup_location, destination_address, destination_location, estimated_fare, booking_status),
        vehicle:vehicles(id, make, model, year, license_plate, vehicle_type),
        customer:customers(id, profiles:user_id(full_name, phone))
      `)
      .eq('id', tripId)
      .maybeSingle();

    if (tripErr || !trip) return null;

    // Fetch handover record if present
    const { data: handover } = await supabaseServiceClient
      .from('vehicle_handovers')
      .select('*')
      .eq('trip_id', tripId)
      .maybeSingle();

    let photos: Array<{ photo_type: string; file_path: string }> = [];
    if (handover) {
      const { data: photoRows } = await supabaseServiceClient
        .from('handover_photos')
        .select('photo_type, file_path')
        .eq('handover_id', handover.id);
      photos = photoRows || [];
    }

    // Fetch fare if present
    const { data: fare } = await supabaseServiceClient
      .from('fares')
      .select('*')
      .eq('trip_id', tripId)
      .maybeSingle();

    // Flatten customer profile
    const rawCustomer = trip.customer as unknown as { id: string; profiles?: { full_name?: string; phone?: string } } | null;
    const formattedCustomer = rawCustomer
      ? {
          id: rawCustomer.id,
          full_name: rawCustomer.profiles?.full_name || 'Customer',
          phone: rawCustomer.profiles?.phone || '',
        }
      : null;

    return {
      ...(trip as unknown as TripRow),
      booking: trip.booking as unknown as TripDetailed['booking'],
      vehicle: trip.vehicle as unknown as TripDetailed['vehicle'],
      customer: formattedCustomer,
      handover: handover
        ? {
            ...handover,
            photos,
          }
        : null,
      fare: fare || null,
    };
  }

  async listDriverTrips(
    driverId: string,
    limit: number,
    offset: number,
    status?: string,
  ): Promise<{ trips: TripDetailed[]; total: number }> {
    let query = supabaseServiceClient
      .from('trips')
      .select(
        `
        *,
        booking:bookings(id, pickup_address, pickup_location, destination_address, destination_location, estimated_fare, booking_status),
        vehicle:vehicles(id, make, model, year, license_plate, vehicle_type),
        customer:customers(id, profiles:user_id(full_name))
      `,
        { count: 'exact' },
      )
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('trip_status', status as unknown as TripRow['trip_status']);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    const trips: TripDetailed[] = (data || []).map((t) => {
      const rawCustomer = t.customer as unknown as { id: string; profiles?: { full_name?: string } } | null;
      return {
        ...(t as unknown as TripRow),
        booking: t.booking as unknown as TripDetailed['booking'],
        vehicle: t.vehicle as unknown as TripDetailed['vehicle'],
        customer: rawCustomer
          ? {
              id: rawCustomer.id,
              full_name: rawCustomer.profiles?.full_name || 'Customer',
            }
          : null,
      };
    });

    return { trips, total: count || 0 };
  }

  async updateTripStatus(
    tripId: string,
    status: string,
    updates: Record<string, unknown> = {},
  ): Promise<TripRow> {
    const payload = {
      trip_status: status,
      updated_at: new Date().toISOString(),
      ...updates,
    };

    const { data, error } = await supabaseServiceClient
      .from('trips')
      .update(payload as unknown as Partial<TripRow>)
      .eq('id', tripId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async getDriverLatestLocation(
    driverId: string,
  ): Promise<{ latitude: number; longitude: number; recorded_at: string } | null> {
    const { data, error } = await supabaseServiceClient
      .from('driver_locations')
      .select('location, updated_at')
      .eq('driver_id', driverId)
      .maybeSingle();

    if (error || !data || !data.location) return null;

    const loc = data.location as unknown as { coordinates?: [number, number] };
    if (loc.coordinates && loc.coordinates.length === 2) {
      return {
        longitude: loc.coordinates[0],
        latitude: loc.coordinates[1],
        recorded_at: data.updated_at,
      };
    }

    return null;
  }

  async getTripBreadcrumbs(
    tripId: string,
  ): Promise<Array<{ latitude: number; longitude: number; speed: number | null; recorded_at: string }>> {
    const { data, error } = await supabaseServiceClient
      .from('trip_locations')
      .select('location, speed, recorded_at')
      .eq('trip_id', tripId)
      .order('recorded_at', { ascending: true });

    if (error || !data) return [];

    return data
      .map((row) => {
        const loc = row.location as unknown as { coordinates?: [number, number] };
        if (loc && loc.coordinates && loc.coordinates.length === 2) {
          return {
            longitude: loc.coordinates[0],
            latitude: loc.coordinates[1],
            speed: row.speed ? Number(row.speed) : null,
            recorded_at: row.recorded_at,
          };
        }
        return null;
      })
      .filter((p): p is { latitude: number; longitude: number; speed: number | null; recorded_at: string } => p !== null);
  }

  async getTripOtp(
    tripId: string,
  ): Promise<{
    otp_hash: string;
    attempts: number;
    max_attempts: number;
    expires_at: string;
    last_generated_at: string | null;
    locked_out_at: string | null;
    verified_at: string | null;
  } | null> {
    const { data, error } = await supabaseServiceClient
      .from('trip_otps')
      .select('*')
      .eq('trip_id', tripId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      otp_hash: data.otp_hash,
      attempts: data.attempts,
      max_attempts: data.max_attempts,
      expires_at: data.expires_at,
      last_generated_at: (data as unknown as { last_generated_at?: string }).last_generated_at || null,
      locked_out_at: (data as unknown as { locked_out_at?: string }).locked_out_at || null,
      verified_at: data.verified_at,
    };
  }

  async upsertTripOtp(
    tripId: string,
    otpHash: string,
    expiresAt: string,
    lastGeneratedAt: string,
  ): Promise<void> {
    const payload = {
      trip_id: tripId,
      otp_hash: otpHash,
      attempts: 0,
      max_attempts: 5,
      expires_at: expiresAt,
      last_generated_at: lastGeneratedAt,
      locked_out_at: null,
      verified_at: null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseServiceClient
      .from('trip_otps')
      .upsert(payload, { onConflict: 'trip_id' });

    if (error) throw error;
  }

  async incrementOtpAttempts(
    tripId: string,
    attempts: number,
    lockedOutAt?: string | null,
  ): Promise<void> {
    const payload: Record<string, unknown> = {
      attempts,
      updated_at: new Date().toISOString(),
    };
    if (lockedOutAt !== undefined) {
      payload['locked_out_at'] = lockedOutAt;
    }

    const { error } = await supabaseServiceClient
      .from('trip_otps')
      .update(payload)
      .eq('trip_id', tripId);

    if (error) throw error;
  }

  async markOtpVerified(tripId: string): Promise<void> {
    const { error } = await supabaseServiceClient
      .from('trip_otps')
      .update({
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('trip_id', tripId);

    if (error) throw error;
  }

  async writeOtpToOutbox(
    tripId: string,
    otpCode: string,
    expiresAt: string,
  ): Promise<void> {
    const { error } = await supabaseServiceClient
      .from('trip_otp_outbox')
      .insert({
        trip_id: tripId,
        otp_code: otpCode,
        expires_at: expiresAt,
      });

    if (error) throw error;
  }

  async createVehicleHandover(data: {
    trip_id: string;
    odometer_before: number;
    fuel_level_before: number;
    notes?: string;
    existing_damage_notes?: string;
  }): Promise<string> {
    const { data: inserted, error } = await supabaseServiceClient
      .from('vehicle_handovers')
      .insert({
        trip_id: data.trip_id,
        odometer_before: data.odometer_before,
        fuel_level_before: data.fuel_level_before,
        notes: data.notes || null,
        existing_damage_notes: data.existing_damage_notes || null,
      })
      .select('id')
      .single();

    if (error) throw error;
    return inserted.id;
  }

  async insertHandoverPhotos(
    photos: Array<{ handover_id: string; photo_type: string; file_path: string }>,
  ): Promise<void> {
    if (photos.length === 0) return;

    const { error } = await supabaseServiceClient
      .from('handover_photos')
      .insert(photos);

    if (error) throw error;
  }

  async updateVehicleHandoverReturn(
    tripId: string,
    data: { odometer_after: number; fuel_level_after?: number; return_notes?: string },
  ): Promise<void> {
    const payload: Record<string, unknown> = {
      odometer_after: data.odometer_after,
      updated_at: new Date().toISOString(),
    };
    if (data.fuel_level_after !== undefined) {
      payload['fuel_level_after'] = data.fuel_level_after;
    }
    if (data.return_notes !== undefined) {
      payload['return_notes'] = data.return_notes;
    }

    const { error } = await supabaseServiceClient
      .from('vehicle_handovers')
      .update(payload)
      .eq('trip_id', tripId);

    if (error) throw error;
  }

  async getFareRule(vehicleType: string): Promise<FareRule | null> {
    const { data, error } = await supabaseServiceClient
      .from('fare_rules')
      .select('*')
      .eq('vehicle_type', vehicleType as unknown as Database['public']['Tables']['fare_rules']['Row']['vehicle_type'])
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      vehicleType: data.vehicle_type as unknown as FareRule['vehicleType'],
      baseFare: Number(data.base_fare),
      perKmRate: Number(data.per_km_rate),
      perMinuteRate: Number(data.per_minute_rate),
      freeWaitingMinutes: Number(data.free_waiting_minutes),
      waitingChargePerMinute: Number(data.waiting_charge_per_minute),
      platformFeePercent: Number(data.platform_fee_percent),
      taxPercent: Number(data.tax_percent),
      minimumFare: Number(data.minimum_fare),
    };
  }

  async recordTripFareAndPayment(
    tripId: string,
    customerId: string,
    driverId: string,
    fare: FareBreakdown,
    transactionId: string,
  ): Promise<void> {
    // 1. Insert fare record
    const { error: fareErr } = await supabaseServiceClient
      .from('fares')
      .insert({
        trip_id: tripId,
        base_fare: fare.baseFare,
        distance_charge: fare.distanceCharge,
        time_charge: fare.timeCharge,
        waiting_charge: fare.waitingCharge,
        platform_fee: fare.platformFee,
        tax: fare.tax,
        discount: fare.discount,
        total_amount: fare.totalAmount,
      });

    if (fareErr) throw fareErr;

    // 2. Insert payments record
    const { error: payErr } = await supabaseServiceClient
      .from('payments')
      .insert({
        trip_id: tripId,
        customer_id: customerId,
        amount: fare.totalAmount,
        payment_method: 'mock_card',
        payment_status: 'completed',
        gateway_transaction_id: transactionId,
      });

    if (payErr) throw payErr;

    // 3. Insert driver_earnings record
    const { error: earnErr } = await supabaseServiceClient
      .from('driver_earnings')
      .insert({
        driver_id: driverId,
        trip_id: tripId,
        gross_amount: fare.totalAmount,
        platform_fee: fare.platformFee,
        net_amount: fare.driverEarnings,
        settlement_status: 'pending',
      });

    if (earnErr) throw earnErr;
  }

  async getIdempotentResponse(
    key: string,
  ): Promise<{ response_status: number; response_body: unknown } | null> {
    const { data, error } = await supabaseServiceClient
      .from('idempotency_keys')
      .select('response_status, response_body')
      .eq('key', key)
      .maybeSingle();

    if (error || !data) return null;
    return {
      response_status: data.response_status,
      response_body: data.response_body,
    };
  }

  async saveIdempotentResponse(
    key: string,
    targetResource: string,
    responseStatus: number,
    responseBody: unknown,
  ): Promise<void> {
    const { error } = await supabaseServiceClient
      .from('idempotency_keys')
      .upsert({
        key,
        target_resource: targetResource,
        response_status: responseStatus,
        response_body: responseBody,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  async getCustomerContact(
    tripId: string,
  ): Promise<{ customerId: string; customerName: string; phone: string } | null> {
    const { data: trip, error } = await supabaseServiceClient
      .from('trips')
      .select(`
        customer_id,
        trip_status,
        customer:customers(id, profiles:user_id(full_name, phone))
      `)
      .eq('id', tripId)
      .maybeSingle();

    if (error || !trip || !trip.customer) return null;

    const rawCust = trip.customer as unknown as { id: string; profiles?: { full_name?: string; phone?: string } };
    return {
      customerId: rawCust.id,
      customerName: rawCust.profiles?.full_name || 'Customer',
      phone: rawCust.profiles?.phone || '',
    };
  }

  async cancelStaleWaitingTrips(
    timeoutMinutes: number,
  ): Promise<Array<{ trip_id: string; driver_id: string; booking_id: string }>> {
    const { data, error } = await supabaseServiceClient.rpc(
      'cancel_stale_waiting_trips',
      { p_waiting_timeout_minutes: timeoutMinutes },
    );

    if (error) throw error;

    return (data || []).map((row: { cancelled_trip_id: string; driver_id: string; booking_id: string }) => ({
      trip_id: row.cancelled_trip_id,
      driver_id: row.driver_id,
      booking_id: row.booking_id,
    }));
  }
}

export const tripsRepository = new TripsRepository();
