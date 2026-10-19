// ryde-capital/backend/src/jobs/staleWaitingTripCheck.ts
// Background job to auto-cancel trips when customer is a no-show (driver waiting > 10 mins)

import { supabaseServiceClient } from '../config/supabase.js';

export interface StaleWaitingTripCheckResult {
  checkedAt: string;
  cancelledCount: number;
  affectedTripIds: string[];
}

export async function checkStaleWaitingTripsJob(
  timeoutMinutes = 10,
): Promise<StaleWaitingTripCheckResult> {
  const now = new Date().toISOString();
  const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString();

  try {
    const { data: rpcRows, error: rpcError } = await supabaseServiceClient.rpc(
      'cancel_stale_waiting_trips',
      { p_waiting_timeout_minutes: timeoutMinutes },
    );

    if (!rpcError && Array.isArray(rpcRows)) {
      const affectedIds = rpcRows.map((r: { trip_id?: string; cancelled_trip_id?: string }) => r.trip_id || r.cancelled_trip_id || '');
      return {
        checkedAt: now,
        cancelledCount: affectedIds.length,
        affectedTripIds: affectedIds,
      };
    }
  } catch (_e) {
    // Fall back to direct query
  }

  // Fallback query
  const { data: staleTrips, error: tripsError } = await supabaseServiceClient
    .from('trips')
    .select('id, driver_id, booking_id, waiting_started_at')
    .eq('trip_status', 'arrived')
    .not('waiting_started_at', 'is', null)
    .lte('waiting_started_at', cutoffTime);

  if (tripsError) {
    console.error('Error fetching stale waiting trips:', tripsError);
    throw tripsError;
  }

  if (!staleTrips || staleTrips.length === 0) {
    return {
      checkedAt: now,
      cancelledCount: 0,
      affectedTripIds: [],
    };
  }

  const cancelledTripIds: string[] = [];

  for (const trip of staleTrips) {
    const { error: updateTripErr } = await supabaseServiceClient
      .from('trips')
      .update({
        trip_status: 'cancelled_by_system',
        cancellation_reason: `Customer no-show: exceeded maximum waiting time of ${timeoutMinutes} minutes`,
        ended_at: now,
        updated_at: now,
      })
      .eq('id', trip.id);

    if (!updateTripErr) {
      cancelledTripIds.push(trip.id);

      // Reset driver to online
      await supabaseServiceClient
        .from('drivers')
        .update({
          availability_status: 'online',
          updated_at: now,
        })
        .eq('id', trip.driver_id);

      // Cancel booking
      await supabaseServiceClient
        .from('bookings')
        .update({
          booking_status: 'cancelled',
          updated_at: now,
        })
        .eq('id', trip.booking_id);
    }
  }

  return {
    checkedAt: now,
    cancelledCount: cancelledTripIds.length,
    affectedTripIds: cancelledTripIds,
  };
}
