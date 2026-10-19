// ryde-capital/backend/src/modules/matching/worker.ts
// Background matching engine worker: matches searching bookings with nearest eligible drivers using widening radius

import { supabaseServiceClient } from '../../config/supabase.js';
import { mapsService, haversineDistance, type VehicleType } from '@ryde/shared';
import { parseLocation } from './geo.js';

export interface MatchingWorkerOptions {
  offerTimeoutSeconds?: number;
  radiusStepsMeters?: number[];
  maxDriverAttempts?: number;
  batchSize?: number;
}

export interface CandidateDriver {
  driver_id: string;
  distance_m: number;
}

export class MatchingWorker {
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;
  readonly offerTimeoutSeconds: number;
  readonly radiusStepsMeters: number[];
  readonly maxDriverAttempts: number;
  readonly batchSize: number;

  constructor(options: MatchingWorkerOptions = {}) {
    this.offerTimeoutSeconds = options.offerTimeoutSeconds ?? 20;
    this.radiusStepsMeters = options.radiusStepsMeters ?? [3000, 5000, 8000];
    this.maxDriverAttempts = options.maxDriverAttempts ?? 3;
    this.batchSize = options.batchSize ?? 10;
  }

  start(intervalMs = 3000): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.runCycle().catch((err) => {
        console.error('Matching worker cycle error:', err);
      });
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runCycle(): Promise<{ expiredCount: number; offersCreated: number; noDriverFoundCount: number }> {
    if (this.isProcessing) {
      return { expiredCount: 0, offersCreated: 0, noDriverFoundCount: 0 };
    }
    this.isProcessing = true;
    try {
      const expiredCount = await this.expireStaleOffers();
      const { offersCreated, noDriverFoundCount } = await this.processSearchingBookings();
      return { expiredCount, offersCreated, noDriverFoundCount };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Identifies offers whose expires_at has passed and marks them 'expired'.
   */
  async expireStaleOffers(): Promise<number> {
    const nowIso = new Date().toISOString();
    const { data: expiredOffers, error } = await supabaseServiceClient
      .from('driver_assignments')
      .select('id, driver_id, booking_id')
      .eq('assignment_status', 'offered')
      .lte('expires_at', nowIso);

    if (error || !expiredOffers || expiredOffers.length === 0) {
      return 0;
    }

    const offerIds = expiredOffers.map((o) => o.id);
    const { error: updateError } = await supabaseServiceClient
      .from('driver_assignments')
      .update({
        assignment_status: 'expired',
        updated_at: nowIso,
      })
      .in('id', offerIds);

    if (updateError) {
      console.error('Failed to update expired assignments:', updateError);
      return 0;
    }

    return offerIds.length;
  }

  /**
   * Finds nearest available drivers using PostGIS RPC or fallback table query.
   */
  async findCandidates(
    lat: number,
    lng: number,
    radiusM: number,
    vehicleType: VehicleType,
    excludedDriverIds: string[],
  ): Promise<CandidateDriver[]> {
    try {
      // 1. Attempt PostGIS RPC nearest_available_drivers
      const { data, error } = await supabaseServiceClient.rpc('nearest_available_drivers', {
        lat,
        lng,
        radius_m: radiusM,
        p_vehicle_type: vehicleType,
        max_results: 10,
      });

      if (!error && Array.isArray(data)) {
        return data
          .map((d: { driver_id: string; distance_m: number }) => ({
            driver_id: d.driver_id,
            distance_m: Number(d.distance_m),
          }))
          .filter((c) => !excludedDriverIds.includes(c.driver_id));
      }
    } catch (_e) {
      // Fallback
    }

    // 2. Direct query fallback
    const { data: onlineDrivers } = await supabaseServiceClient
      .from('drivers')
      .select('id, allowed_vehicle_types, verification_status, availability_status')
      .eq('verification_status', 'approved')
      .eq('availability_status', 'online')
      .contains('allowed_vehicle_types', [vehicleType]);

    if (!onlineDrivers || onlineDrivers.length === 0) {
      return [];
    }

    const availableIds = onlineDrivers
      .map((d) => d.id)
      .filter((id) => !excludedDriverIds.includes(id));

    if (availableIds.length === 0) {
      return [];
    }

    const { data: locations } = await supabaseServiceClient
      .from('driver_locations')
      .select('driver_id, location, updated_at')
      .in('driver_id', availableIds);

    const candidates: CandidateDriver[] = [];
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    for (const loc of locations || []) {
      if (new Date(loc.updated_at).getTime() < tenMinutesAgo) continue;

      const driverCoords = parseLocation(loc.location);
      const distance = haversineDistance({ latitude: lat, longitude: lng }, driverCoords);
      if (distance <= radiusM) {
        candidates.push({
          driver_id: loc.driver_id,
          distance_m: distance,
        });
      }
    }

    // Sort nearest first
    candidates.sort((a, b) => a.distance_m - b.distance_m);
    return candidates;
  }

  /**
   * Processes bookings with status 'searching'.
   */
  async processSearchingBookings(): Promise<{ offersCreated: number; noDriverFoundCount: number }> {
    let offersCreated = 0;
    let noDriverFoundCount = 0;

    // Fetch searching bookings ordered by creation time
    const { data: bookings, error } = await supabaseServiceClient
      .from('bookings')
      .select('id, vehicle_id, pickup_location, pickup_address, created_at')
      .eq('booking_status', 'searching')
      .order('created_at', { ascending: true })
      .limit(this.batchSize);

    if (error || !bookings || bookings.length === 0) {
      return { offersCreated, noDriverFoundCount };
    }

    for (const booking of bookings) {
      // 1. Check if there is currently an active offered assignment for this booking
      const nowIso = new Date().toISOString();
      const { data: activeAssignments } = await supabaseServiceClient
        .from('driver_assignments')
        .select('id, expires_at, assignment_status')
        .eq('booking_id', booking.id)
        .eq('assignment_status', 'offered')
        .gt('expires_at', nowIso);

      if (activeAssignments && activeAssignments.length > 0) {
        // Driver offer is currently pending countdown, wait for response
        continue;
      }

      // 2. Fetch past assignments to find already attempted drivers
      const { data: pastAssignments } = await supabaseServiceClient
        .from('driver_assignments')
        .select('driver_id')
        .eq('booking_id', booking.id);

      const attemptedDriverIds = (pastAssignments || []).map((a) => a.driver_id);

      // 3. Fetch vehicle details to get required vehicle_type
      const { data: vehicle } = await supabaseServiceClient
        .from('vehicles')
        .select('vehicle_type')
        .eq('id', booking.vehicle_id)
        .maybeSingle();

      const vehicleType: VehicleType = (vehicle?.vehicle_type as VehicleType) ?? 'four_wheeler';
      const pickupCoords = parseLocation(booking.pickup_location);

      // 4. Search candidates by widening radius in steps
      let candidate: CandidateDriver | null = null;

      for (const radius of this.radiusStepsMeters) {
        const candidates = await this.findCandidates(
          pickupCoords.latitude,
          pickupCoords.longitude,
          radius,
          vehicleType,
          attemptedDriverIds,
        );

        if (candidates.length > 0) {
          candidate = candidates[0]!;
          break;
        }
      }

      // 5. If no candidate found
      if (!candidate) {
        // If driver attempts reached limit or radius completely exhausted with prior attempts
        if (attemptedDriverIds.length >= this.maxDriverAttempts || attemptedDriverIds.length > 0) {
          await supabaseServiceClient
            .from('bookings')
            .update({
              booking_status: 'no_driver_found',
              updated_at: new Date().toISOString(),
            })
            .eq('id', booking.id);

          noDriverFoundCount++;
        }
        continue;
      }

      // 6. Candidate found! Fetch candidate location to get accurate ETA from maps service
      const { data: driverLocRow } = await supabaseServiceClient
        .from('driver_locations')
        .select('location')
        .eq('driver_id', candidate.driver_id)
        .maybeSingle();

      const driverCoords = parseLocation(driverLocRow?.location);
      const mapsResult = await mapsService.getDistanceAndDuration(driverCoords, pickupCoords);

      const expiresAt = new Date(Date.now() + this.offerTimeoutSeconds * 1000).toISOString();

      // 7. Create assignment offer (NEVER include customer phone number!)
      const { error: insertError } = await supabaseServiceClient
        .from('driver_assignments')
        .insert({
          booking_id: booking.id,
          driver_id: candidate.driver_id,
          distance_to_customer_m: mapsResult.distanceMeters,
          estimated_arrival_s: mapsResult.durationSeconds,
          assignment_status: 'offered',
          expires_at: expiresAt,
        });

      if (!insertError) {
        offersCreated++;
      } else {
        console.error('Failed to create assignment offer:', insertError);
      }
    }

    return { offersCreated, noDriverFoundCount };
  }
}

export const matchingWorker = new MatchingWorker();
