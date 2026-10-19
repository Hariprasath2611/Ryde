// ryde-capital/backend/src/jobs/staleDriverCheck.ts
// Background job that sets drivers offline if they haven't sent a location update for 2 minutes

import { supabaseServiceClient } from '../config/supabase.js';

export interface StaleDriverCheckResult {
  checkedAt: string;
  offlineCount: number;
  affectedDriverIds: string[];
}

export async function checkStaleDriversJob(
  thresholdMs = 2 * 60 * 1000,
): Promise<StaleDriverCheckResult> {
  const now = new Date().toISOString();
  const cutoffTime = new Date(Date.now() - thresholdMs).toISOString();

  try {
    // Attempt RPC if defined in migration 014
    const { data: count, error: rpcError } = await supabaseServiceClient.rpc(
      'set_stale_drivers_offline',
      {
        p_threshold_interval: '2 minutes',
      },
    );

    if (!rpcError && typeof count === 'number') {
      return {
        checkedAt: now,
        offlineCount: count,
        affectedDriverIds: [],
      };
    }
  } catch (_e) {
    // Fall back to direct query
  }

  // Fallback direct query
  // 1. Fetch all online drivers
  const { data: onlineDrivers, error: driversError } = await supabaseServiceClient
    .from('drivers')
    .select('id, user_id')
    .eq('availability_status', 'online');

  if (driversError) {
    console.error('Error fetching online drivers:', driversError);
    throw driversError;
  }

  if (!onlineDrivers || onlineDrivers.length === 0) {
    return {
      checkedAt: now,
      offlineCount: 0,
      affectedDriverIds: [],
    };
  }

  const driverIds = onlineDrivers.map((d) => d.id);

  // 2. Fetch latest locations for these drivers
  const { data: locations, error: locError } = await supabaseServiceClient
    .from('driver_locations')
    .select('driver_id, updated_at')
    .in('driver_id', driverIds);

  if (locError) {
    console.error('Error fetching driver locations for stale check:', locError);
    throw locError;
  }

  const locationMap = new Map<string, string>();
  for (const loc of locations || []) {
    locationMap.set(loc.driver_id, loc.updated_at);
  }

  // 3. Fetch active trips to avoid taking drivers offline during an active ride
  const { data: activeTrips } = await supabaseServiceClient
    .from('trips')
    .select('driver_id')
    .in('driver_id', driverIds)
    .in('trip_status', [
      'assigned',
      'dispatched',
      'arrived_at_pickup',
      'vehicle_handover_pending',
      'started',
    ]);

  const activeDriverIds = new Set((activeTrips || []).map((t) => t.driver_id));
  const affectedDriverIds: string[] = [];

  for (const driver of onlineDrivers) {
    if (activeDriverIds.has(driver.id)) {
      continue; // Skip drivers currently on a trip
    }

    const lastUpdated = locationMap.get(driver.id);
    const isStale = !lastUpdated || new Date(lastUpdated).getTime() < new Date(cutoffTime).getTime();

    if (isStale) {
      affectedDriverIds.push(driver.id);
    }
  }

  if (affectedDriverIds.length > 0) {
    const { error: updateError } = await supabaseServiceClient
      .from('drivers')
      .update({
        availability_status: 'offline',
        updated_at: now,
      })
      .in('id', affectedDriverIds);

    if (updateError) {
      console.error('Failed to set stale drivers offline:', updateError);
      throw updateError;
    }
  }

  return {
    checkedAt: now,
    offlineCount: affectedDriverIds.length,
    affectedDriverIds,
  };
}
