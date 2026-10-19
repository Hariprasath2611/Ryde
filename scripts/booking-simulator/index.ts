// scripts/booking-simulator/index.ts
// Ryde Booking Simulator CLI: generates simulated bookings, stress-tests matching, and monitors assignments

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from backend or root .env
const rootEnvPath = path.resolve(process.cwd(), '.env');
const backendEnvPath = path.resolve(process.cwd(), 'ryde-capital/backend/.env');

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

const SUPABASE_URL = process.env['SUPABASE_URL'] || process.env['EXPO_PUBLIC_SUPABASE_URL'] || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SERVICE_ROLE_KEY'] || '';

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required to run the booking simulator.');
  console.error('Please configure SUPABASE_SERVICE_ROLE_KEY in ryde-capital/backend/.env or root .env');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Default Bangalore center coordinate
const BANGALORE_CENTER = { lat: 12.9716, lng: 77.5946 };

export interface SimulatorOptions {
  lat?: number;
  lng?: number;
  nearDriver?: string;
  vehicleType?: 'two_wheeler' | 'three_wheeler' | 'four_wheeler';
  pickupAddress?: string;
  destAddress?: string;
  fare?: number;
}

/**
 * Ensures a simulated customer and associated vehicle exist in the database.
 */
export async function ensureTestCustomerAndVehicle(
  vehicleType: 'two_wheeler' | 'three_wheeler' | 'four_wheeler' = 'four_wheeler',
): Promise<{ customerId: string; vehicleId: string }> {
  const customerUserId = '00000000-0000-0000-0000-000000000099';
  const customerId = '00000000-0000-0000-0000-000000000098';
  const vehicleId = '00000000-0000-0000-0000-000000000097';

  // 1. Ensure profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', customerUserId)
    .maybeSingle();

  if (!existingProfile) {
    await supabase.from('profiles').insert({
      id: customerUserId,
      phone: '+919999900099',
      full_name: 'Simulated Customer',
      role: 'customer',
      account_status: 'active',
      phone_verified: true,
    });
  }

  // 2. Ensure customer record exists
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .maybeSingle();

  if (!existingCustomer) {
    await supabase.from('customers').insert({
      id: customerId,
      user_id: customerUserId,
      customer_code: 'CUST-SIM-01',
      verification_status: 'approved',
    });
  }

  // 3. Ensure vehicle exists for required vehicle_type
  const { data: existingVehicle } = await supabase
    .from('vehicles')
    .select('id, vehicle_type')
    .eq('customer_id', customerId)
    .eq('vehicle_type', vehicleType)
    .maybeSingle();

  if (existingVehicle) {
    return { customerId, vehicleId: existingVehicle.id };
  }

  // Insert matching vehicle
  const { data: newVehicle, error: vehErr } = await supabase
    .from('vehicles')
    .insert({
      customer_id: customerId,
      vehicle_code: `VEH-SIM-${vehicleType.toUpperCase()}`,
      registration_number: `KA01SIM${Math.floor(1000 + Math.random() * 9000)}`,
      make: 'Simulated Make',
      model: `${vehicleType} model`,
      vehicle_type: vehicleType,
      verification_status: 'approved',
    })
    .select('id')
    .single();

  if (vehErr || !newVehicle) {
    // If conflict, query existing
    const { data: fallbackVeh } = await supabase
      .from('vehicles')
      .select('id')
      .eq('customer_id', customerId)
      .limit(1)
      .single();

    return { customerId, vehicleId: fallbackVeh?.id ?? vehicleId };
  }

  return { customerId, vehicleId: newVehicle.id };
}

/**
 * Creates a simulated booking in status 'searching'.
 */
export async function createBooking(options: SimulatorOptions = {}) {
  let lat = options.lat ?? BANGALORE_CENTER.lat;
  let lng = options.lng ?? BANGALORE_CENTER.lng;

  // If nearDriver specified, fetch driver's latest coordinates
  if (options.nearDriver) {
    const { data: driver } = await supabase
      .from('drivers')
      .select('id, driver_code')
      .or(`driver_code.eq.${options.nearDriver},id.eq.${options.nearDriver}`)
      .maybeSingle();

    if (driver) {
      const { data: loc } = await supabase
        .from('driver_locations')
        .select('location')
        .eq('driver_id', driver.id)
        .maybeSingle();

      if (loc?.location) {
        // Parse POINT(lng lat)
        const match = String(loc.location).match(/POINT\s*\(\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*\)/i);
        if (match && match[1] && match[2]) {
          lng = parseFloat(match[1]) + (Math.random() - 0.5) * 0.005; // ~200m offset
          lat = parseFloat(match[2]) + (Math.random() - 0.5) * 0.005;
          console.log(`📍 Found driver ${driver.driver_code}. Placing pickup nearby at (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      }
    } else {
      console.warn(`⚠️ Driver '${options.nearDriver}' not found. Falling back to default coordinates.`);
    }
  }

  const vehicleType = options.vehicleType ?? 'four_wheeler';
  const { customerId, vehicleId } = await ensureTestCustomerAndVehicle(vehicleType);

  const pickupLat = lat;
  const pickupLng = lng;
  // Destination offset ~3 to 6 km away
  const destLat = pickupLat + (Math.random() > 0.5 ? 1 : -1) * (0.02 + Math.random() * 0.03);
  const destLng = pickupLng + (Math.random() > 0.5 ? 1 : -1) * (0.02 + Math.random() * 0.03);

  const pickupWkt = `POINT(${pickupLng.toFixed(6)} ${pickupLat.toFixed(6)})`;
  const destWkt = `POINT(${destLng.toFixed(6)} ${destLat.toFixed(6)})`;

  const pickupAddress = options.pickupAddress ?? `Pickup Point near (${pickupLat.toFixed(4)}, ${pickupLng.toFixed(4)})`;
  const destAddress = options.destAddress ?? `Destination Point near (${destLat.toFixed(4)}, ${destLng.toFixed(4)})`;
  const fare = options.fare ?? Math.round(250 + Math.random() * 300);

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      customer_id: customerId,
      vehicle_id: vehicleId,
      pickup_location: pickupWkt,
      pickup_address: pickupAddress,
      destination_location: destWkt,
      destination_address: destAddress,
      booking_status: 'searching',
      estimated_fare: fare,
    })
    .select('id, booking_status, estimated_fare, created_at')
    .single();

  if (error || !booking) {
    console.error('❌ Failed to create booking:', error);
    throw error;
  }

  console.log('✅ Booking Created Successfully:');
  console.log(`   ID:        ${booking.id}`);
  console.log(`   Status:    ${booking.booking_status}`);
  console.log(`   Vehicle:   ${vehicleType}`);
  console.log(`   Fare:      ₹${booking.estimated_fare}`);
  console.log(`   Pickup:    ${pickupAddress}`);
  console.log(`   Dropoff:   ${destAddress}`);
  console.log('   The matching worker will now detect this booking and offer to the nearest driver.');

  return booking;
}

/**
 * Cancels a booking.
 */
export async function cancelBooking(bookingId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ booking_status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select('id, booking_status')
    .single();

  if (error) {
    console.error('❌ Failed to cancel booking:', error);
    return;
  }
  console.log(`✅ Booking ${bookingId} has been cancelled.`);
}

/**
 * Lists recent bookings and assignments in an ASCII table.
 */
export async function listStatus() {
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, booking_status, estimated_fare, pickup_address, destination_address, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !bookings) {
    console.error('❌ Failed to fetch bookings:', error);
    return;
  }

  console.log('\n=== RECENT BOOKINGS & MATCHING STATUS ===\n');
  console.log('ID                                   | STATUS          | FARE    | PICKUP');
  console.log('-------------------------------------+-----------------+---------+--------------------------');

  for (const b of bookings) {
    const idShort = b.id;
    const status = b.booking_status.padEnd(15);
    const fare = `₹${b.estimated_fare}`.padEnd(7);
    const pickup = b.pickup_address.substring(0, 26);
    console.log(`${idShort} | ${status} | ${fare} | ${pickup}`);

    // Fetch assignments for this booking
    const { data: assignments } = await supabase
      .from('driver_assignments')
      .select('id, driver_id, assignment_status, expires_at, created_at')
      .eq('booking_id', b.id)
      .order('created_at', { ascending: true });

    if (assignments && assignments.length > 0) {
      for (const a of assignments) {
        console.log(`   └─ Offer -> Driver: ${a.driver_id.substring(0, 8)}... | Status: ${a.assignment_status.toUpperCase()} | Expires: ${new Date(a.expires_at).toLocaleTimeString()}`);
      }
    }
  }
  console.log('\n');
}

/**
 * Reads the latest unexpired trip OTP from the dev outbox for a trip.
 */
export async function readTripOtp(tripId: string): Promise<string | null> {
  const { data: outboxRows, error } = await supabase
    .from('trip_otp_outbox')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !outboxRows || outboxRows.length === 0) {
    console.error(`❌ No OTP found in outbox for trip ${tripId}`);
    return null;
  }

  const latest = outboxRows[0]!;
  const isExpired = new Date(latest.expires_at).getTime() < Date.now();
  console.log(`\n🔑 TRIP OTP FOR ${tripId}: [ ${latest.otp_code} ]`);
  console.log(`   Generated At: ${new Date(latest.created_at).toLocaleTimeString()}`);
  console.log(`   Expires At:   ${new Date(latest.expires_at).toLocaleTimeString()} ${isExpired ? '(EXPIRED)' : '(VALID)'}\n`);

  return latest.otp_code;
}

/**
 * Cancels a trip as the customer.
 */
export async function cancelTripAsCustomer(tripId: string, reason = 'Customer cancelled from simulator'): Promise<void> {
  const { data: trip, error: fetchErr } = await supabase
    .from('trips')
    .select('id, driver_id, booking_id, trip_status')
    .eq('id', tripId)
    .single();

  if (fetchErr || !trip) {
    console.error(`❌ Trip ${tripId} not found`);
    return;
  }

  // Update trip
  const { error: tripErr } = await supabase
    .from('trips')
    .update({
      trip_status: 'cancelled_by_customer',
      cancellation_reason: reason,
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', tripId);

  if (tripErr) {
    console.error('❌ Failed to cancel trip:', tripErr);
    return;
  }

  // Free driver back to online
  await supabase
    .from('drivers')
    .update({
      availability_status: 'online',
      updated_at: new Date().toISOString(),
    })
    .eq('id', trip.driver_id);

  // Cancel booking
  await supabase
    .from('bookings')
    .update({
      booking_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', trip.booking_id);

  console.log(`✅ Trip ${tripId} cancelled by customer. Driver ${trip.driver_id} reset to ONLINE.`);
}

/**
 * Shows comprehensive trip state, handover details, and fare breakdown.
 */
export async function showTripStatus(tripId: string): Promise<void> {
  const { data: trip, error } = await supabase
    .from('trips')
    .select(`
      *,
      booking:bookings(*),
      vehicle:vehicles(*),
      driver:drivers(driver_code, user_id)
    `)
    .eq('id', tripId)
    .single();

  if (error || !trip) {
    console.error(`❌ Trip ${tripId} not found`);
    return;
  }

  const { data: handover } = await supabase
    .from('vehicle_handovers')
    .select('*')
    .eq('trip_id', tripId)
    .maybeSingle();

  const { data: fare } = await supabase
    .from('fares')
    .select('*')
    .eq('trip_id', tripId)
    .maybeSingle();

  const d = trip.driver as unknown as { driver_code?: string } | null;
  const v = trip.vehicle as unknown as { make?: string; model?: string; license_plate?: string } | null;
  const b = trip.booking as unknown as { pickup_address?: string; destination_address?: string } | null;

  console.log(`\n================== TRIP ${tripId} ==================`);
  console.log(`Status:              ${trip.trip_status.toUpperCase()}`);
  console.log(`Driver Code:         ${d?.driver_code || trip.driver_id}`);
  console.log(`Vehicle:             ${v?.make} ${v?.model} (${v?.license_plate})`);
  console.log(`Pickup Address:      ${b?.pickup_address}`);
  console.log(`Destination Address: ${b?.destination_address}`);
  if (trip.waiting_started_at) {
    console.log(`Waiting Started:     ${new Date(trip.waiting_started_at).toLocaleTimeString()}`);
    console.log(`Waiting Duration:    ${trip.waiting_duration_s || 0} seconds`);
  }
  if (handover) {
    console.log('\n--- VEHICLE HANDOVER ---');
    console.log(`Odometer Before:     ${handover.odometer_before || 'N/A'} km`);
    console.log(`Odometer After:      ${handover.odometer_after || 'N/A'} km`);
    console.log(`Fuel Level Before:   ${handover.fuel_level_before || 'N/A'}%`);
    console.log(`Fuel Level After:    ${handover.fuel_level_after || 'N/A'}%`);
    console.log(`Damage Notes:        ${handover.existing_damage_notes || 'None'}`);
  }
  if (fare) {
    console.log('\n--- FARE BREAKDOWN ---');
    console.log(`Base Fare:           ₹${fare.base_fare}`);
    console.log(`Distance Charge:     ₹${fare.distance_charge}`);
    console.log(`Time Charge:         ₹${fare.time_charge}`);
    console.log(`Waiting Charge:      ₹${fare.waiting_charge}`);
    console.log(`Platform Fee:        ₹${fare.platform_fee}`);
    console.log(`GST / Tax:           ₹${fare.tax}`);
    console.log(`TOTAL FARE:          ₹${fare.total_amount}`);
  }
  console.log('====================================================\n');
}

/**
 * CLI parser and execution runner.
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'create': {
      let lat: number | undefined;
      let lng: number | undefined;
      let nearDriver: string | undefined;
      let vehicleType: 'two_wheeler' | 'three_wheeler' | 'four_wheeler' = 'four_wheeler';
      let fare: number | undefined;

      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--lat' && args[i + 1]) lat = parseFloat(args[++i]!);
        if (args[i] === '--lng' && args[i + 1]) lng = parseFloat(args[++i]!);
        if (args[i] === '--near-driver' && args[i + 1]) nearDriver = args[++i]!;
        if (args[i] === '--vehicle' && args[i + 1]) vehicleType = args[++i] as any;
        if (args[i] === '--fare' && args[i + 1]) fare = parseFloat(args[++i]!);
      }

      await createBooking({ lat, lng, nearDriver, vehicleType, fare });
      break;
    }

    case 'random': {
      const vehicleTypes: ('two_wheeler' | 'three_wheeler' | 'four_wheeler')[] = [
        'four_wheeler',
        'two_wheeler',
        'three_wheeler',
      ];
      const randomVehicle = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
      const randomLat = BANGALORE_CENTER.lat + (Math.random() - 0.5) * 0.04;
      const randomLng = BANGALORE_CENTER.lng + (Math.random() - 0.5) * 0.04;

      await createBooking({ lat: randomLat, lng: randomLng, vehicleType: randomVehicle });
      break;
    }

    case 'repeat': {
      let intervalSec = 15;
      let count = Infinity;

      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--interval' && args[i + 1]) intervalSec = parseInt(args[++i]!, 10);
        if (args[i] === '--count' && args[i + 1]) count = parseInt(args[++i]!, 10);
      }

      console.log(`🔁 Repeating booking simulation every ${intervalSec}s (Target count: ${count}). Press Ctrl+C to stop.\n`);
      let generated = 0;

      const run = async () => {
        try {
          console.log(`\n[${new Date().toLocaleTimeString()}] Generating booking #${generated + 1}...`);
          const randomLat = BANGALORE_CENTER.lat + (Math.random() - 0.5) * 0.04;
          const randomLng = BANGALORE_CENTER.lng + (Math.random() - 0.5) * 0.04;
          await createBooking({ lat: randomLat, lng: randomLng });
          generated++;
          if (generated >= count) {
            console.log('✅ Completed repeat target count.');
            process.exit(0);
          }
        } catch (e) {
          console.error('Error generating repeated booking:', e);
        }
      };

      await run();
      setInterval(run, intervalSec * 1000);
      break;
    }

    case 'cancel': {
      const bookingId = args[1];
      if (!bookingId) {
        console.error('Usage: cancel <booking_id>');
        process.exit(1);
      }
      await cancelBooking(bookingId);
      break;
    }

    case 'otp': {
      let tripId = args[1];
      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--trip' && args[i + 1]) tripId = args[++i]!;
      }
      if (!tripId) {
        console.error('Usage: otp <trip_id> OR otp --trip <trip_id>');
        process.exit(1);
      }
      await readTripOtp(tripId);
      break;
    }

    case 'cancel-trip': {
      let tripId = args[1];
      let reason = 'Customer cancelled from simulator';
      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--trip' && args[i + 1]) tripId = args[++i]!;
        if (args[i] === '--reason' && args[i + 1]) reason = args[++i]!;
      }
      if (!tripId) {
        console.error('Usage: cancel-trip --trip <trip_id> [--reason <text>]');
        process.exit(1);
      }
      await cancelTripAsCustomer(tripId, reason);
      break;
    }

    case 'trip-status': {
      let tripId = args[1];
      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--trip' && args[i + 1]) tripId = args[++i]!;
      }
      if (!tripId) {
        console.error('Usage: trip-status <trip_id> OR trip-status --trip <trip_id>');
        process.exit(1);
      }
      await showTripStatus(tripId);
      break;
    }

    case 'status':
    case 'list': {
      await listStatus();
      break;
    }

    case 'help':
    default: {
      console.log(`
Ryde Platform - Booking & Trip Simulator CLI (Phase 4)

Commands:
  create           Create a searching booking near a location or driver
                   Options:
                     --lat <number>           Pickup latitude (default: Bangalore)
                     --lng <number>           Pickup longitude
                     --near-driver <code/id>  Place pickup ~200m from driver location
                     --vehicle <type>         two_wheeler | three_wheeler | four_wheeler (default: four_wheeler)
                     --fare <number>          Estimated fare in INR

  random           Create a booking with randomized coordinates and vehicle type

  repeat           Continuously create bookings on an interval
                   Options:
                     --interval <seconds>     Interval between bookings (default: 15)
                     --count <number>         Maximum number of bookings to generate

  cancel <id>      Cancel a pending or searching booking by ID

  otp <trip_id>    Read the latest unexpired trip OTP from the dev outbox

  cancel-trip      Cancel an active trip as the customer
                   Options:
                     --trip <trip_id>         Target trip ID
                     --reason <text>          Cancellation reason

  trip-status      Display comprehensive state of a trip, handover, and fare
                   Options:
                     --trip <trip_id>         Target trip ID

  list / status    Display recent bookings and active offers

Examples:
  npx tsx scripts/booking-simulator/index.ts otp --trip <TRIP_UUID>
  npx tsx scripts/booking-simulator/index.ts trip-status --trip <TRIP_UUID>
  npx tsx scripts/booking-simulator/index.ts cancel-trip --trip <TRIP_UUID> --reason "Changed plans"
      `);
      break;
    }
  }
}

// Run CLI if invoked directly
if (process.argv[1]?.includes('booking-simulator')) {
  main().catch((err) => {
    console.error('Simulator runtime error:', err);
    process.exit(1);
  });
}
