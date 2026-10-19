import { supabaseServiceClient } from '../../config/supabase.js';
import type { Database, AvailabilityStatus } from '@ryde/shared';

export type DriverRow = Database['public']['Tables']['drivers']['Row'];
export type DriverLocationRow = Database['public']['Tables']['driver_locations']['Row'];

export interface IAvailabilityRepository {
  getDriverByUserId(userId: string): Promise<DriverRow | null>;
  getDriverLocation(driverId: string): Promise<DriverLocationRow | null>;
  hasActiveTrip(driverId: string): Promise<boolean>;
  setDriverAvailability(driverId: string, status: AvailabilityStatus): Promise<DriverRow>;
}

export class AvailabilityRepository implements IAvailabilityRepository {
  async getDriverByUserId(userId: string): Promise<DriverRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('drivers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getDriverLocation(driverId: string): Promise<DriverLocationRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('driver_locations')
      .select('*')
      .eq('driver_id', driverId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async hasActiveTrip(driverId: string): Promise<boolean> {
    const { data, error } = await supabaseServiceClient
      .from('trips')
      .select('id')
      .eq('driver_id', driverId)
      .in('trip_status', [
        'assigned',
        'dispatched',
        'arrived_at_pickup',
        'vehicle_handover_pending',
        'started',
      ])
      .limit(1);

    if (error) throw error;
    return (data && data.length > 0) ?? false;
  }

  async setDriverAvailability(driverId: string, status: AvailabilityStatus): Promise<DriverRow> {
    const { data, error } = await supabaseServiceClient
      .from('drivers')
      .update({
        availability_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', driverId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }
}

export const availabilityRepository = new AvailabilityRepository();
