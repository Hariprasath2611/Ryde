// ryde-capital/backend/src/modules/safety/service.ts
// Phase 5: Safety Business Logic (Emergency Contacts, SOS with Geocoding & SMS, Live Trip Sharing & Public Tracking)

import crypto from 'crypto';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  mapsService,
  mockSmsProvider,
  type ISmsProvider,
  haversineDistance,
} from '@ryde/shared';
import {
  safetyRepository,
  type ISafetyRepository,
} from './repository.js';
import { supabaseServiceClient } from '../../config/supabase.js';
import type {
  TriggerSosInput,
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
} from './schema.js';

export class SafetyService {
  constructor(
    private repo: ISafetyRepository = safetyRepository,
    private smsProvider: ISmsProvider = mockSmsProvider,
  ) {}

  private async getDriverByUserIdOrThrow(userId: string) {
    const { data: driver } = await supabaseServiceClient
      .from('drivers')
      .select('id, user_id, onboarding_status')
      .eq('user_id', userId)
      .maybeSingle();

    if (!driver) {
      throw new ForbiddenError('Driver profile not found');
    }
    return driver;
  }

  // ==========================================================================
  // 1. EMERGENCY CONTACTS (CRUD, MAX 5)
  // ==========================================================================

  async getEmergencyContacts(userId: string) {
    return this.repo.getEmergencyContacts(userId);
  }

  async createEmergencyContact(userId: string, input: CreateEmergencyContactInput) {
    const count = await this.repo.countEmergencyContacts(userId);
    if (count >= 5) {
      throw new BadRequestError('Maximum limit of 5 emergency contacts reached');
    }

    const contact = await this.repo.createEmergencyContact(userId, input);
    return contact;
  }

  async updateEmergencyContact(
    userId: string,
    contactId: string,
    input: UpdateEmergencyContactInput,
  ) {
    const existing = await this.repo.getEmergencyContactById(userId, contactId);
    if (!existing) {
      throw new NotFoundError('Emergency contact not found');
    }

    const updated = await this.repo.updateEmergencyContact(userId, contactId, input);
    return updated;
  }

  async deleteEmergencyContact(userId: string, contactId: string) {
    const existing = await this.repo.getEmergencyContactById(userId, contactId);
    if (!existing) {
      throw new NotFoundError('Emergency contact not found');
    }

    await this.repo.deleteEmergencyContact(userId, contactId);
    return { success: true, message: 'Emergency contact removed successfully' };
  }

  // ==========================================================================
  // 2. SOS FLOW (DEDUPLICATION, REVERSE GEOCODE, SMS & SUPPORT NOTIFICATION)
  // ==========================================================================

  async triggerTripSos(userId: string, tripId: string, input: TriggerSosInput) {
    const driver = await this.getDriverByUserIdOrThrow(userId);

    // Verify trip existence and driver ownership
    const { data: trip } = await supabaseServiceClient
      .from('trips')
      .select(`
        id,
        driver_id,
        customer_id,
        trip_status,
        booking:booking_id(pickup_address, destination_address)
      `)
      .eq('id', tripId)
      .maybeSingle();

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    if (trip.driver_id !== driver.id) {
      throw new ForbiddenError('You can only trigger SOS for your own active trip');
    }

    // Deduplicate repeated presses within a 60-second window
    const recentSos = await this.repo.getRecentSosForTrip(trip.id, 60);
    if (recentSos) {
      return {
        event: recentSos,
        deduped: true,
        message: 'An active SOS alert was already submitted recently for this trip.',
      };
    }

    // Reverse-geocode address (with cache / fallback)
    let address = 'Location coordinates recorded';
    try {
      const geoResult = await mapsService.reverseGeocode({
        latitude: input.latitude,
        longitude: input.longitude,
      });
      if (geoResult?.formattedAddress) {
        address = geoResult.formattedAddress;
      }
    } catch (_e) {
      address = `Lat: ${input.latitude.toFixed(5)}, Lng: ${input.longitude.toFixed(5)}`;
    }

    // Create SOS event record
    const sosEvent = await this.repo.createSosEvent({
      trip_id: trip.id,
      triggered_by: userId,
      latitude: input.latitude,
      longitude: input.longitude,
      reverse_geocoded_address: address,
      notes: input.reason || 'Driver triggered in-app emergency SOS',
    });

    // Send SMS to emergency contacts
    const contacts = await this.repo.getEmergencyContacts(userId);
    const smsPromises = contacts.map(async (c) => {
      const msg = `EMERGENCY ALERT: Ryde driver is requesting immediate emergency assistance. Current Location: ${address}. Please reach out or contact local authorities immediately.`;
      return this.smsProvider.sendSms({ to: c.phone, message: msg }).catch((err) => {
        console.warn(`[SMS] Failed to send SOS SMS to contact ${c.phone}:`, err);
      });
    });
    await Promise.allSettled(smsPromises);

    // Record audit log
    await this.repo.logAudit({
      userId,
      action: 'sos_triggered',
      entityType: 'trip',
      entityId: trip.id,
      metadata: {
        sosId: sosEvent.id,
        latitude: input.latitude,
        longitude: input.longitude,
        address,
        contactsNotified: contacts.length,
      },
    });

    return {
      event: sosEvent,
      deduped: false,
      emergencyContactsNotified: contacts.length,
      reverseGeocodedAddress: address,
    };
  }

  async cancelTripSos(userId: string, sosId: string, reason?: string) {
    const sosEvent = await this.repo.getSosEventById(sosId);
    if (!sosEvent) {
      throw new NotFoundError('SOS event not found');
    }

    if (sosEvent.triggered_by !== userId) {
      throw new ForbiddenError('Only the driver who triggered this alert may cancel it');
    }

    const cancelled = await this.repo.cancelSosEvent(
      sosId,
      reason || 'False alarm reported and cancelled by driver',
    );

    // Record audit log
    await this.repo.logAudit({
      userId,
      action: 'sos_cancelled',
      entityType: 'sos_event',
      entityId: sosId,
      metadata: { reason: reason || 'False alarm' },
    });

    return {
      success: true,
      event: cancelled,
      message: 'SOS emergency alert has been cancelled as a false alarm',
    };
  }

  // ==========================================================================
  // 3. LIVE TRIP SHARING & DATA-MINIMIZED PUBLIC TRACKING
  // ==========================================================================

  async createTripShare(userId: string, tripId: string) {
    const driver = await this.getDriverByUserIdOrThrow(userId);

    const { data: trip } = await supabaseServiceClient
      .from('trips')
      .select('id, driver_id, trip_status')
      .eq('id', tripId)
      .maybeSingle();

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    if (trip.driver_id !== driver.id) {
      throw new ForbiddenError('You may only share trips you are actively assigned to');
    }

    // Generate secure token
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const share = await this.repo.createTripShare(trip.id, token, expiresAt);

    // Audit log
    await this.repo.logAudit({
      userId,
      action: 'trip_share_created',
      entityType: 'trip',
      entityId: trip.id,
      metadata: { shareToken: token, expiresAt },
    });

    return {
      shareToken: share.share_token,
      shareUrl: `/public/track/${share.share_token}`,
      expiresAt: share.expires_at,
    };
  }

  async getPublicTrackingData(token: string) {
    const share = await this.repo.getTripShareByToken(token);
    if (!share) {
      throw new NotFoundError('Live trip tracking link is invalid or expired');
    }

    // Check expiry
    if (new Date(share.expires_at).getTime() < Date.now()) {
      throw new NotFoundError('Live trip tracking link has expired');
    }

    // Fetch trip with relations
    const { data: trip } = await supabaseServiceClient
      .from('trips')
      .select(`
        id,
        trip_status,
        driver_id,
        customer_id,
        vehicle:vehicles(vehicle_type),
        booking:booking_id(pickup_address, destination_address, destination_location),
        driver:drivers(profiles:user_id(full_name)),
        customer:customers(profiles:user_id(full_name))
      `)
      .eq('id', share.trip_id)
      .maybeSingle();

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    // RULE: The link dies when the trip ends!
    const terminalStatuses = ['completed', 'cancelled_by_driver', 'cancelled_by_customer', 'cancelled_by_system'];
    if (terminalStatuses.includes(trip.trip_status)) {
      throw new NotFoundError('This trip has concluded. Live tracking is no longer active.');
    }

    // Fetch latest location of the driver
    const { data: locData } = await supabaseServiceClient
      .from('driver_locations')
      .select('location, heading, speed, recorded_at')
      .eq('driver_id', trip.driver_id)
      .maybeSingle();

    let liveCoords = { latitude: 12.9716, longitude: 77.5946, heading: 0 };
    if (locData?.location && typeof locData.location === 'object') {
      const locObj = locData.location as any;
      if (Array.isArray(locObj.coordinates)) {
        liveCoords = {
          longitude: locObj.coordinates[0],
          latitude: locObj.coordinates[1],
          heading: locData.heading || 0,
        };
      }
    }

    // Data minimization: first names only, no phone numbers, no vehicle registration numbers
    const driverFullName = (trip.driver as any)?.profiles?.full_name || 'Driver';
    const driverFirstName = driverFullName.trim().split(' ')[0] || 'Driver';

    const customerFullName = (trip.customer as any)?.profiles?.full_name || 'Passenger';
    const customerFirstName = customerFullName.trim().split(' ')[0] || 'Passenger';

    const vehicleType = (trip.vehicle as any)?.vehicle_type || 'four_wheeler';
    const bookingData = Array.isArray(trip.booking) ? (trip.booking[0] as any) : (trip.booking as any);

    // Approximate ETA in minutes
    let etaMinutes = 12;
    if (bookingData?.destination_location) {
      try {
        const destObj = bookingData.destination_location as any;
        if (Array.isArray(destObj.coordinates)) {
          const destDistMeters = haversineDistance(
            { latitude: liveCoords.latitude, longitude: liveCoords.longitude },
            { latitude: destObj.coordinates[1], longitude: destObj.coordinates[0] },
          );
          // Assuming avg city speed 25 km/h -> ~416 meters/min
          etaMinutes = Math.max(1, Math.round(destDistMeters / 416));
        }
      } catch (_e) {
        // Fallback default ETA
      }
    }

    return {
      tripId: trip.id,
      tripStatus: trip.trip_status,
      driverFirstName,
      customerFirstName,
      vehicleType,
      liveLocation: liveCoords,
      pickupAddress: bookingData?.pickup_address || '',
      destinationAddress: bookingData?.destination_address || '',
      etaMinutes,
    };
  }

  renderTrackingHtml(trackingData: {
    tripStatus: string;
    driverFirstName: string;
    customerFirstName: string;
    vehicleType: string;
    liveLocation: { latitude: number; longitude: number; heading: number };
    destinationAddress: string;
    etaMinutes: number;
  }): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Trip Tracking | Ryde Safety</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #0f172a; color: #f8fafc; }
    .header { padding: 16px 24px; background: #1e293b; border-bottom: 1px solid #334155; display: flex; align-items: center; justify-content: space-between; }
    .brand { font-size: 20px; font-weight: 700; color: #38bdf8; letter-spacing: -0.5px; }
    .badge { background: #0284c7; color: #fff; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); }
    .eta-box { text-align: center; margin-bottom: 20px; }
    .eta-value { font-size: 42px; font-weight: 800; color: #22c55e; }
    .eta-label { font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #334155; font-size: 15px; }
    .info-label { color: #94a3b8; }
    .info-value { font-weight: 600; color: #f8fafc; }
    .map-preview { height: 260px; background: #090d16; border-radius: 8px; border: 1px solid #334155; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; margin-top: 16px; }
    .pin { width: 16px; height: 16px; background: #38bdf8; border-radius: 50%; box-shadow: 0 0 0 8px rgba(56, 189, 248, 0.25); animation: pulse 2s infinite; }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); } 70% { box-shadow: 0 0 0 16px rgba(56, 189, 248, 0); } 100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); } }
    .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Ryde Live Track</div>
    <div class="badge">${trackingData.tripStatus.replace(/_/g, ' ')}</div>
  </div>
  <div class="container">
    <div class="card">
      <div class="eta-box">
        <div class="eta-value">~${trackingData.etaMinutes} min</div>
        <div class="eta-label">Estimated Arrival Time</div>
      </div>
      <div class="info-row">
        <span class="info-label">Driver</span>
        <span class="info-value">${trackingData.driverFirstName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Vehicle Category</span>
        <span class="info-value">${trackingData.vehicleType.toUpperCase()}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Destination</span>
        <span class="info-value">${trackingData.destinationAddress || 'Assigned Destination'}</span>
      </div>
      <div class="map-preview">
        <div class="pin"></div>
        <div style="position: absolute; bottom: 12px; font-size: 12px; color: #94a3b8;">
          Live Coordinates: ${trackingData.liveLocation.latitude.toFixed(4)}, ${trackingData.liveLocation.longitude.toFixed(4)}
        </div>
      </div>
    </div>
    <div class="footer">
      Protected with Ryde Safety System • Private live link expires when trip ends
    </div>
  </div>
</body>
</html>`;
  }

  // ==========================================================================
  // 4. ADMIN & SUPPORT SOS QUEUE
  // ==========================================================================

  async listOpenSos() {
    return this.repo.listOpenSosEvents();
  }

  async acknowledgeSos(adminUserId: string, sosId: string, notes?: string) {
    const event = await this.repo.getSosEventById(sosId);
    if (!event) {
      throw new NotFoundError('SOS event not found');
    }

    const acknowledged = await this.repo.acknowledgeSosEvent(sosId, adminUserId, notes);

    await this.repo.logAudit({
      userId: adminUserId,
      action: 'sos_acknowledged',
      entityType: 'sos_event',
      entityId: sosId,
      metadata: { notes },
    });

    return acknowledged;
  }

  async resolveSos(adminUserId: string, sosId: string, notes: string) {
    const event = await this.repo.getSosEventById(sosId);
    if (!event) {
      throw new NotFoundError('SOS event not found');
    }

    const resolved = await this.repo.resolveSosEvent(sosId, adminUserId, notes);

    await this.repo.logAudit({
      userId: adminUserId,
      action: 'sos_resolved',
      entityType: 'sos_event',
      entityId: sosId,
      metadata: { notes },
    });

    return resolved;
  }
}

export const safetyService = new SafetyService();
