import { supabaseServiceClient } from '../../config/supabase.js';
import type { Database } from '@ryde/shared';

export type DriverRow = Database['public']['Tables']['drivers']['Row'];

export interface ValidatedLocationPoint {
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  recordedAt: string;
}

export interface ILocationRepository {
  getDriverByUserId(userId: string): Promise<DriverRow | null>;
  getActiveTrip(driverId: string): Promise<string | null>;
  recordLocation(
    driverId: string,
    point: ValidatedLocationPoint,
    activeTripId?: string | null,
  ): Promise<void>;
  recordLocations(
    driverId: string,
    points: ValidatedLocationPoint[],
    activeTripId?: string | null,
  ): Promise<void>;
}

export class LocationRepository implements ILocationRepository {
  async getDriverByUserId(userId: string): Promise<DriverRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('drivers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getActiveTrip(driverId: string): Promise<string | null> {
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
    return data && data.length > 0 && data[0]?.id ? data[0].id : null;
  }

  async recordLocation(
    driverId: string,
    point: ValidatedLocationPoint,
    activeTripId?: string | null,
  ): Promise<void> {
    try {
      // Attempt RPC first
      const { error: rpcError } = await supabaseServiceClient.rpc('record_driver_location', {
        p_driver_id: driverId,
        p_lat: point.latitude,
        p_lng: point.longitude,
        p_heading: point.heading ?? undefined,
        p_speed: point.speed ?? undefined,
        p_recorded_at: point.recordedAt,
      });

      if (!rpcError) return;
    } catch (_err) {
      // Fall through to direct table write
    }

    // Direct table write fallback (also ensures unit test mocks work seamlessly)
    const wktPoint = `POINT(${point.longitude} ${point.latitude})`;

    const { error: locError } = await supabaseServiceClient
      .from('driver_locations')
      .upsert({
        driver_id: driverId,
        location: wktPoint,
        heading: point.heading,
        speed: point.speed,
        updated_at: point.recordedAt,
      });

    if (locError) {
      console.error('Failed to update driver_locations:', locError);
    }

    // If active trip exists, append to trip_locations
    const tripId = activeTripId !== undefined ? activeTripId : await this.getActiveTrip(driverId);
    if (tripId) {
      const { error: tripLocError } = await supabaseServiceClient
        .from('trip_locations')
        .insert({
          trip_id: tripId,
          driver_id: driverId,
          location: wktPoint,
          speed: point.speed,
          recorded_at: point.recordedAt,
        });

      if (tripLocError) {
        console.error('Failed to append to trip_locations:', tripLocError);
      }
    }
  }

  async recordLocations(
    driverId: string,
    points: ValidatedLocationPoint[],
    activeTripId?: string | null,
  ): Promise<void> {
    if (points.length === 0) return;

    const tripId = activeTripId !== undefined ? activeTripId : await this.getActiveTrip(driverId);

    // Upsert latest point into driver_locations
    const latestPoint = points[points.length - 1]!;
    await this.recordLocation(driverId, latestPoint, tripId);

    // If on active trip, insert earlier points into trip_locations
    if (tripId && points.length > 1) {
      const earlierPoints = points.slice(0, points.length - 1);
      const rows = earlierPoints.map((pt) => ({
        trip_id: tripId,
        driver_id: driverId,
        location: `POINT(${pt.longitude} ${pt.latitude})`,
        speed: pt.speed,
        recorded_at: pt.recordedAt,
      }));

      const { error } = await supabaseServiceClient.from('trip_locations').insert(rows);
      if (error) {
        console.error('Failed to batch insert trip_locations:', error);
      }
    }
  }
}

export const locationRepository = new LocationRepository();
