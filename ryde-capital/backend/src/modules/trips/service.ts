// ryde-capital/backend/src/modules/trips/service.ts
// Phase 4: Full Trip Lifecycle, State Machine Transitions, Geofencing, OTP, Handover & Fares

import crypto from 'crypto';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  mapsService,
  calculateFare,
  mockPaymentProvider,
  haversineDistance,
  type FareBreakdown,
  type PaymentResult,
} from '@ryde/shared';
import {
  tripsRepository,
  type ITripsRepository,
  type TripDetailed,
  type TripRow,
} from './repository.js';
import {
  assertValidTransition,
  normalizeTripStatus,
} from './stateMachine.js';
import type {
  VerifyOtpInput,
  VehicleHandoverInput,
  EndTripInput,
  CancelTripInput,
  TripHistoryQuery,
} from './schema.js';

export interface LocationCoord {
  latitude: number;
  longitude: number;
}

export class TripsService {
  constructor(private repo: ITripsRepository = tripsRepository) {}

  /**
   * Helper to ensure the authenticated user is the assigned driver or admin.
   */
  private async getDriverOrThrow(userId: string) {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) {
      throw new ForbiddenError('Only registered drivers may access trip lifecycle');
    }
    return driver;
  }

  /**
   * Helper to verify driver assignment and ownership of trip.
   */
  private async getOwnedTripOrThrow(driverId: string, tripId: string): Promise<TripRow> {
    const trip = await this.repo.getTripById(tripId);
    if (!trip) {
      throw new NotFoundError(`Trip with ID '${tripId}' not found`);
    }
    if (trip.driver_id !== driverId) {
      throw new ForbiddenError('You are not authorized to perform actions on this trip');
    }
    return trip;
  }

  /**
   * Parses coordinates from a PostGIS geo point or JSON representation.
   */
  private parseCoords(point: unknown): LocationCoord | null {
    if (!point) return null;
    if (typeof point === 'object' && point !== null) {
      const p = point as { coordinates?: [number, number]; lat?: number; lng?: number; latitude?: number; longitude?: number };
      if (Array.isArray(p.coordinates) && p.coordinates.length === 2) {
        return { longitude: p.coordinates[0], latitude: p.coordinates[1] };
      }
      if (p.latitude !== undefined && p.longitude !== undefined) {
        return { latitude: p.latitude, longitude: p.longitude };
      }
      if (p.lat !== undefined && p.lng !== undefined) {
        return { latitude: p.lat, longitude: p.lng };
      }
    }
    return null;
  }

  /**
   * Computes Haversine distance in meters between two coordinate points.
   */
  private calculateDistanceMeters(c1: LocationCoord, c2: LocationCoord): number {
    return haversineDistance(c1, c2);
  }

  /**
   * Filters GPS trail noise and returns total travel distance in meters.
   */
  private computeGpsTrailDistance(
    breadcrumbs: Array<{ latitude: number; longitude: number; speed: number | null; recorded_at: string }>,
  ): number {
    if (breadcrumbs.length < 2) return 0;

    let totalMeters = 0;
    for (let i = 1; i < breadcrumbs.length; i++) {
      const prev = breadcrumbs[i - 1]!;
      const curr = breadcrumbs[i]!;

      // Drop impossible speeds (> 150 km/h)
      if (curr.speed && curr.speed > 150) continue;

      const dist = haversineDistance(
        { latitude: prev.latitude, longitude: prev.longitude },
        { latitude: curr.latitude, longitude: curr.longitude },
      );

      const timeDeltaSeconds =
        (new Date(curr.recorded_at).getTime() - new Date(prev.recorded_at).getTime()) / 1000;

      // Filter out impossible teleportation jumps (> 180 km/h implied speed)
      if (timeDeltaSeconds > 0) {
        const impliedSpeedKmh = (dist / 1000) / (timeDeltaSeconds / 3600);
        if (impliedSpeedKmh > 180) continue;
      }

      totalMeters += dist;
    }

    return Math.round(totalMeters * 100) / 100;
  }

  // ==========================================================================
  // 1. GET TRIP DETAILS & HISTORY
  // ==========================================================================

  async getTrip(userId: string, tripId: string): Promise<TripDetailed> {
    const driver = await this.getDriverOrThrow(userId);
    const trip = await this.getOwnedTripOrThrow(driver.id, tripId);

    const details = await this.repo.getTripDetails(trip.id);
    if (!details) {
      throw new NotFoundError(`Trip details for '${tripId}' could not be loaded`);
    }

    // Privacy rule: Only include customer phone if trip is actively in progress
    const activeStatuses = ['assigned', 'heading_to_pickup', 'arrived', 'otp_verified', 'handover_done', 'in_progress'];
    if (!activeStatuses.includes(normalizeTripStatus(details.trip_status)) && details.customer) {
      details.customer.phone = undefined;
    }

    return details;
  }

  async listTrips(
    userId: string,
    query: TripHistoryQuery,
  ): Promise<{ trips: TripDetailed[]; total: number; page: number; limit: number }> {
    const driver = await this.getDriverOrThrow(userId);
    const limit = query.limit || 10;
    const page = query.page || 1;
    const offset = (page - 1) * limit;

    const { trips, total } = await this.repo.listDriverTrips(
      driver.id,
      limit,
      offset,
      query.status,
    );

    return { trips, total, page, limit };
  }

  // ==========================================================================
  // 2. START HEADING TO PICKUP
  // ==========================================================================

  async startHeadingToPickup(
    userId: string,
    tripId: string,
    idempotencyKey?: string,
  ): Promise<{ success: boolean; tripStatus: string }> {
    if (idempotencyKey) {
      const cached = await this.repo.getIdempotentResponse(idempotencyKey);
      if (cached) return cached.response_body as { success: boolean; tripStatus: string };
    }

    const driver = await this.getDriverOrThrow(userId);
    const trip = await this.getOwnedTripOrThrow(driver.id, tripId);

    assertValidTransition(trip.trip_status, 'heading_to_pickup');

    await this.repo.updateTripStatus(trip.id, 'heading_to_pickup');

    const result = { success: true, tripStatus: 'heading_to_pickup' };
    if (idempotencyKey) {
      await this.repo.saveIdempotentResponse(idempotencyKey, `trips:${tripId}:start-heading`, 200, result);
    }
    return result;
  }

  // ==========================================================================
  // 3. MARK ARRIVED AT PICKUP (GEOFENCED)
  // ==========================================================================

  async markArrived(
    userId: string,
    tripId: string,
    idempotencyKey?: string,
  ): Promise<{ success: boolean; tripStatus: string; waitingStartedAt: string }> {
    if (idempotencyKey) {
      const cached = await this.repo.getIdempotentResponse(idempotencyKey);
      if (cached) return cached.response_body as { success: boolean; tripStatus: string; waitingStartedAt: string };
    }

    const driver = await this.getDriverOrThrow(userId);
    const trip = await this.getOwnedTripOrThrow(driver.id, tripId);

    assertValidTransition(trip.trip_status, 'arrived');

    // Geofence check: driver must be within 150m of pickup
    const driverLoc = await this.repo.getDriverLatestLocation(driver.id);
    const tripDetails = await this.repo.getTripDetails(trip.id);
    const pickupCoords = this.parseCoords(tripDetails?.booking?.pickup_location);

    if (driverLoc && pickupCoords) {
      const distanceToPickup = this.calculateDistanceMeters(
        { latitude: driverLoc.latitude, longitude: driverLoc.longitude },
        pickupCoords,
      );

      const maxAllowedMeters = 150;
      if (distanceToPickup > maxAllowedMeters) {
        throw new BadRequestError(
          `Driver is ${Math.round(distanceToPickup)}m away from pickup location. You must be within ${maxAllowedMeters}m to mark arrived.`,
          { currentDistanceMeters: Math.round(distanceToPickup), maxAllowedMeters },
        );
      }
    }

    const waitingStartedAt = new Date().toISOString();
    await this.repo.updateTripStatus(trip.id, 'arrived', {
      waiting_started_at: waitingStartedAt,
    });

    const result = { success: true, tripStatus: 'arrived', waitingStartedAt };
    if (idempotencyKey) {
      await this.repo.saveIdempotentResponse(idempotencyKey, `trips:${tripId}:arrived`, 200, result);
    }
    return result;
  }

  // ==========================================================================
  // 4. GENERATE OTP (DEV OUTBOX & COOLDOWN)
  // ==========================================================================

  async generateOtp(
    userId: string,
    tripId: string,
  ): Promise<{ success: boolean; message: string; expiresInSeconds: number }> {
    const driver = await this.getDriverOrThrow(userId);
    const trip = await this.getOwnedTripOrThrow(driver.id, tripId);

    // Check regenerate cooldown (60 seconds)
    const existingOtp = await this.repo.getTripOtp(trip.id);
    if (existingOtp && existingOtp.last_generated_at) {
      const elapsedSeconds = (Date.now() - new Date(existingOtp.last_generated_at).getTime()) / 1000;
      const cooldownSeconds = 60;
      if (elapsedSeconds < cooldownSeconds) {
        const remaining = Math.ceil(cooldownSeconds - elapsedSeconds);
        throw new BadRequestError(
          `Please wait ${remaining} seconds before requesting a new trip OTP`,
          { cooldownRemainingSeconds: remaining },
        );
      }
    }

    // Generate cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash('sha256').update(`${rawOtp}:${trip.id}`).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry
    const nowIso = new Date().toISOString();

    await this.repo.upsertTripOtp(trip.id, otpHash, expiresAt, nowIso);

    // Deliver plain OTP to dev outbox table for simulator consumption (NEVER logged to stdout)
    await this.repo.writeOtpToOutbox(trip.id, rawOtp, expiresAt);

    return {
      success: true,
      message: 'Trip OTP generated successfully and sent to customer',
      expiresInSeconds: 600,
    };
  }

  // ==========================================================================
  // 5. VERIFY OTP (CONSTANT-TIME, ATTEMPTS & LOCKOUT)
  // ==========================================================================

  async verifyOtp(
    userId: string,
    tripId: string,
    input: VerifyOtpInput,
    idempotencyKey?: string,
  ): Promise<{ success: boolean; tripStatus: string }> {
    if (idempotencyKey) {
      const cached = await this.repo.getIdempotentResponse(idempotencyKey);
      if (cached) return cached.response_body as { success: boolean; tripStatus: string };
    }

    const driver = await this.getDriverOrThrow(userId);
    const trip = await this.getOwnedTripOrThrow(driver.id, tripId);

    assertValidTransition(trip.trip_status, 'otp_verified');

    const storedOtp = await this.repo.getTripOtp(trip.id);
    if (!storedOtp) {
      throw new BadRequestError('No OTP has been generated for this trip yet');
    }

    // Check lockout
    if (storedOtp.locked_out_at || storedOtp.attempts >= storedOtp.max_attempts) {
      throw new BadRequestError(
        'Maximum verification attempts exceeded. Please regenerate a new trip OTP.',
        { lockedOut: true },
      );
    }

    // Check expiry
    if (new Date(storedOtp.expires_at).getTime() < Date.now()) {
      throw new BadRequestError('Trip OTP has expired. Please regenerate a new OTP.', {
        expired: true,
      });
    }

    // Compute candidate hash and compare in constant time
    const candidateHash = crypto.createHash('sha256').update(`${input.otp}:${trip.id}`).digest('hex');
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(candidateHash, 'utf8'),
      Buffer.from(storedOtp.otp_hash, 'utf8'),
    );

    if (!isMatch) {
      const nextAttempts = storedOtp.attempts + 1;
      const isLockedOut = nextAttempts >= storedOtp.max_attempts;
      const lockedOutAt = isLockedOut ? new Date().toISOString() : null;

      await this.repo.incrementOtpAttempts(trip.id, nextAttempts, lockedOutAt);

      const remainingAttempts = Math.max(0, storedOtp.max_attempts - nextAttempts);
      throw new BadRequestError(
        `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
        { remainingAttempts, lockedOut: isLockedOut },
      );
    }

    // Success: mark OTP verified and transition trip
    await this.repo.markOtpVerified(trip.id);
    await this.repo.updateTripStatus(trip.id, 'otp_verified');

    const result = { success: true, tripStatus: 'otp_verified' };
    if (idempotencyKey) {
      await this.repo.saveIdempotentResponse(idempotencyKey, `trips:${tripId}:verify-otp`, 200, result);
    }
    return result;
  }

  // ==========================================================================
  // 6. RECORD VEHICLE HANDOVER (MANDATORY PHOTOS & CONDITION)
  // ==========================================================================

  async recordHandover(
    userId: string,
    tripId: string,
    input: VehicleHandoverInput,
    idempotencyKey?: string,
  ): Promise<{ success: boolean; tripStatus: string }> {
    if (idempotencyKey) {
      const cached = await this.repo.getIdempotentResponse(idempotencyKey);
      if (cached) return cached.response_body as { success: boolean; tripStatus: string };
    }

    const driver = await this.getDriverOrThrow(userId);
    const trip = await this.getOwnedTripOrThrow(driver.id, tripId);

    assertValidTransition(trip.trip_status, 'handover_done');

    // Verify all 6 mandatory photo types are present
    const mandatoryPhotos = ['front', 'back', 'left', 'right', 'odometer', 'fuel_gauge'];
    const uploadedTypes = new Set(input.photos.map((p) => p.photoType.toLowerCase()));
    const missingPhotos = mandatoryPhotos.filter((t) => !uploadedTypes.has(t));

    if (missingPhotos.length > 0) {
      throw new BadRequestError(
        `Missing mandatory vehicle handover photos: ${missingPhotos.join(', ')}`,
        { missingPhotos },
      );
    }

    // Create handover record
    const handoverId = await this.repo.createVehicleHandover({
      trip_id: trip.id,
      odometer_before: input.odometerBefore,
      fuel_level_before: input.fuelLevelBefore,
      notes: input.notes,
      existing_damage_notes: input.existingDamageNotes,
    });

    // Insert photos
    const photoRows = input.photos.map((p) => ({
      handover_id: handoverId,
      photo_type: p.photoType,
      file_path: p.filePath,
    }));
    await this.repo.insertHandoverPhotos(photoRows);

    // Transition state
    await this.repo.updateTripStatus(trip.id, 'handover_done');

    const result = { success: true, tripStatus: 'handover_done' };
    if (idempotencyKey) {
      await this.repo.saveIdempotentResponse(idempotencyKey, `trips:${tripId}:handover`, 200, result);
    }
    return result;
  }

  // ==========================================================================
  // 7. START TRIP
  // ==========================================================================

  async startTrip(
    userId: string,
    tripId: string,
    idempotencyKey?: string,
  ): Promise<{ success: boolean; tripStatus: string; startedAt: string }> {
    if (idempotencyKey) {
      const cached = await this.repo.getIdempotentResponse(idempotencyKey);
      if (cached) return cached.response_body as { success: boolean; tripStatus: string; startedAt: string };
    }

    const driver = await this.getDriverOrThrow(userId);
    const trip = await this.getOwnedTripOrThrow(driver.id, tripId);

    assertValidTransition(trip.trip_status, 'in_progress');

    const startedAt = new Date().toISOString();
    let waitingDurationSeconds = 0;
    if (trip.waiting_started_at) {
      waitingDurationSeconds = Math.max(
        0,
        Math.floor((new Date(startedAt).getTime() - new Date(trip.waiting_started_at).getTime()) / 1000),
      );
    }

    await this.repo.updateTripStatus(trip.id, 'in_progress', {
      started_at: startedAt,
      waiting_duration_s: waitingDurationSeconds,
    });

    const result = { success: true, tripStatus: 'in_progress', startedAt };
    if (idempotencyKey) {
      await this.repo.saveIdempotentResponse(idempotencyKey, `trips:${tripId}:start`, 200, result);
    }
    return result;
  }

  // ==========================================================================
  // 8. END TRIP (GEOFENCE, GPS TRAIL DISTANCE, FARE & PAYMENT)
  // ==========================================================================

  async endTrip(
    userId: string,
    tripId: string,
    input: EndTripInput,
    idempotencyKey?: string,
  ): Promise<{
    success: boolean;
    tripStatus: string;
    fare: FareBreakdown;
    payment: PaymentResult;
  }> {
    if (idempotencyKey) {
      const cached = await this.repo.getIdempotentResponse(idempotencyKey);
      if (cached) {
        return cached.response_body as {
          success: boolean;
          tripStatus: string;
          fare: FareBreakdown;
          payment: PaymentResult;
        };
      }
    }

    const driver = await this.getDriverOrThrow(userId);
    const trip = await this.getOwnedTripOrThrow(driver.id, tripId);

    assertValidTransition(trip.trip_status, 'completed');

    const tripDetails = await this.repo.getTripDetails(trip.id);
    const driverLoc = await this.repo.getDriverLatestLocation(driver.id);
    const destCoords = this.parseCoords(tripDetails?.booking?.destination_location);

    // Destination geofence check (200m)
    let flaggedForAudit = false;
    let auditReason: string | null = null;

    if (driverLoc && destCoords) {
      const distToDest = this.calculateDistanceMeters(
        { latitude: driverLoc.latitude, longitude: driverLoc.longitude },
        destCoords,
      );

      const maxDestinationMeters = 200;
      if (distToDest > maxDestinationMeters) {
        if (!input.earlyDropReason || input.earlyDropReason.trim().length < 5) {
          throw new BadRequestError(
            `Trip ended ${Math.round(distToDest)}m away from destination (exceeds ${maxDestinationMeters}m limit). A valid early drop reason is required.`,
            { distanceToDestinationMeters: Math.round(distToDest), maxDestinationMeters },
          );
        }
        flaggedForAudit = true;
        auditReason = `Early drop / diversion (${Math.round(distToDest)}m from destination): ${input.earlyDropReason}`;
      }
    }

    // Compute actual distance from GPS trail
    const breadcrumbs = await this.repo.getTripBreadcrumbs(trip.id);
    let finalDistanceMeters = this.computeGpsTrailDistance(breadcrumbs);
    const endedAt = new Date().toISOString();

    const startedTime = trip.started_at ? new Date(trip.started_at).getTime() : Date.now();
    const finalDurationSeconds = Math.max(0, Math.floor((new Date(endedAt).getTime() - startedTime) / 1000));

    // Fallback to route estimate if trail is empty or suspiciously small
    if (finalDistanceMeters < 50 && tripDetails?.booking?.estimated_fare) {
      const estimatedKm = (trip.estimated_distance_m ? Number(trip.estimated_distance_m) : 5000);
      finalDistanceMeters = estimatedKm;
    }

    const finalDistanceKm = finalDistanceMeters / 1000;
    const finalDurationMinutes = finalDurationSeconds / 60;
    const waitingMinutes = (trip.waiting_duration_s || 0) / 60;

    // Fetch fare rule for vehicle type
    const vehicleType = tripDetails?.vehicle?.vehicle_type || 'four_wheeler';
    const fareRule = await this.repo.getFareRule(vehicleType);
    if (!fareRule) {
      throw new NotFoundError(`Fare rules for vehicle type '${vehicleType}' not found`);
    }

    // Calculate itemized fare
    const fareBreakdown = calculateFare({
      distanceKm: finalDistanceKm,
      durationMinutes: finalDurationMinutes,
      waitingMinutes,
      rule: fareRule,
    });

    // Execute mock payment charge
    const paymentResult = await mockPaymentProvider.charge({
      tripId: trip.id,
      customerId: trip.customer_id,
      amount: fareBreakdown.totalAmount,
    });

    // Persist fare, payment & driver earnings
    await this.repo.recordTripFareAndPayment(
      trip.id,
      trip.customer_id,
      driver.id,
      fareBreakdown,
      paymentResult.transactionId,
    );

    // Update return handover details
    await this.repo.updateVehicleHandoverReturn(trip.id, {
      odometer_after: input.odometerAfter,
      fuel_level_after: input.fuelLevelAfter,
      return_notes: input.notes,
    });

    // Mark trip completed
    await this.repo.updateTripStatus(trip.id, 'completed', {
      ended_at: endedAt,
      distance_m: finalDistanceMeters,
      duration_s: finalDurationSeconds,
      final_fare: fareBreakdown.totalAmount,
      actual_distance_m: finalDistanceMeters,
      actual_duration_s: finalDurationSeconds,
      flagged_for_audit: flaggedForAudit,
      audit_reason: auditReason,
    });

    const result = {
      success: true,
      tripStatus: 'completed',
      fare: fareBreakdown,
      payment: paymentResult,
    };

    if (idempotencyKey) {
      await this.repo.saveIdempotentResponse(idempotencyKey, `trips:${tripId}:end`, 200, result);
    }

    return result;
  }

  // ==========================================================================
  // 9. CANCEL TRIP (DRIVER BEFORE START)
  // ==========================================================================

  async cancelTrip(
    userId: string,
    tripId: string,
    input: CancelTripInput,
    idempotencyKey?: string,
  ): Promise<{ success: boolean; tripStatus: string }> {
    if (idempotencyKey) {
      const cached = await this.repo.getIdempotentResponse(idempotencyKey);
      if (cached) return cached.response_body as { success: boolean; tripStatus: string };
    }

    const driver = await this.getDriverOrThrow(userId);
    const trip = await this.getOwnedTripOrThrow(driver.id, tripId);

    assertValidTransition(trip.trip_status, 'cancelled_by_driver');

    const endedAt = new Date().toISOString();
    await this.repo.updateTripStatus(trip.id, 'cancelled_by_driver', {
      ended_at: endedAt,
      cancellation_reason: input.reason,
      cancelled_by: userId,
    });

    const result = { success: true, tripStatus: 'cancelled_by_driver' };
    if (idempotencyKey) {
      await this.repo.saveIdempotentResponse(idempotencyKey, `trips:${tripId}:cancel`, 200, result);
    }
    return result;
  }

  // ==========================================================================
  // 10. GET TRIP ROUTE (CACHED DIRECTIONS)
  // ==========================================================================

  async getTripRoute(userId: string, tripId: string) {
    const driver = await this.getDriverOrThrow(userId);
    const trip = await this.getOwnedTripOrThrow(driver.id, tripId);

    const tripDetails = await this.repo.getTripDetails(trip.id);
    const pickupCoords = this.parseCoords(tripDetails?.booking?.pickup_location);
    const destCoords = this.parseCoords(tripDetails?.booking?.destination_location);

    if (!pickupCoords || !destCoords) {
      throw new BadRequestError('Trip coordinates are incomplete or missing');
    }

    const directions = await mapsService.getDirections(pickupCoords, destCoords);

    return {
      polyline: directions.polyline,
      distanceMeters: directions.distanceMeters,
      durationSeconds: directions.durationSeconds,
      pickupCoords,
      destinationCoords: destCoords,
      pickupAddress: tripDetails?.booking?.pickup_address || '',
      destinationAddress: tripDetails?.booking?.destination_address || '',
    };
  }

  // ==========================================================================
  // 11. GET CUSTOMER CONTACT (ACTIVE TRIPS ONLY)
  // ==========================================================================

  async getCustomerContact(userId: string, tripId: string) {
    const driver = await this.getDriverOrThrow(userId);
    const trip = await this.getOwnedTripOrThrow(driver.id, tripId);

    const activeStatuses = ['assigned', 'heading_to_pickup', 'arrived', 'otp_verified', 'handover_done', 'in_progress'];
    if (!activeStatuses.includes(normalizeTripStatus(trip.trip_status))) {
      throw new ForbiddenError('Customer contact is only accessible during an active trip');
    }

    const contact = await this.repo.getCustomerContact(trip.id);
    if (!contact) {
      throw new NotFoundError('Customer contact information could not be found');
    }

    return contact;
  }
}

export const tripsService = new TripsService();
