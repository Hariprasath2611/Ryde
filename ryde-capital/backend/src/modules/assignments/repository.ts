import { supabaseServiceClient } from '../../config/supabase.js';
import type { Database, BookingStatus, VehicleType } from '@ryde/shared';

export type DriverRow = Database['public']['Tables']['drivers']['Row'];
export type DriverAssignmentRow = Database['public']['Tables']['driver_assignments']['Row'];
export type BookingRow = Database['public']['Tables']['bookings']['Row'];

export interface AssignmentWithBooking extends DriverAssignmentRow {
  booking: {
    id: string;
    pickup_address: string;
    pickup_location: unknown;
    destination_address: string;
    destination_location: unknown;
    estimated_fare: number;
    booking_status: BookingStatus;
    vehicle_type?: VehicleType;
  } | null;
}

export interface IAssignmentsRepository {
  getDriverByUserId(userId: string): Promise<DriverRow | null>;
  getAssignmentById(id: string): Promise<DriverAssignmentRow | null>;
  getActiveOffer(driverId: string): Promise<AssignmentWithBooking | null>;
  listAssignments(
    driverId: string,
    limit: number,
    offset: number,
  ): Promise<AssignmentWithBooking[]>;
  getBookingWithVehicle(bookingId: string): Promise<(BookingRow & { vehicle_type?: VehicleType }) | null>;
  acceptAssignment(
    assignmentId: string,
    driverId: string,
  ): Promise<{ status: string; trip_id: string; booking_id: string }>;
  rejectAssignment(
    assignmentId: string,
    driverId: string,
    reason?: string,
  ): Promise<DriverAssignmentRow>;
}

export class AssignmentsRepository implements IAssignmentsRepository {
  async getDriverByUserId(userId: string): Promise<DriverRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('drivers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getAssignmentById(id: string): Promise<DriverAssignmentRow | null> {
    const { data, error } = await supabaseServiceClient
      .from('driver_assignments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getBookingWithVehicle(
    bookingId: string,
  ): Promise<(BookingRow & { vehicle_type?: VehicleType }) | null> {
    const { data: booking, error } = await supabaseServiceClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (error || !booking) return null;

    const { data: vehicle } = await supabaseServiceClient
      .from('vehicles')
      .select('vehicle_type')
      .eq('id', booking.vehicle_id)
      .maybeSingle();

    return {
      ...booking,
      vehicle_type: vehicle?.vehicle_type as VehicleType | undefined,
    };
  }

  async getActiveOffer(driverId: string): Promise<AssignmentWithBooking | null> {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabaseServiceClient
      .from('driver_assignments')
      .select('*')
      .eq('driver_id', driverId)
      .eq('assignment_status', 'offered')
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    const booking = await this.getBookingWithVehicle(data.booking_id);

    return {
      ...data,
      booking: booking
        ? {
            id: booking.id,
            pickup_address: booking.pickup_address,
            pickup_location: booking.pickup_location,
            destination_address: booking.destination_address,
            destination_location: booking.destination_location,
            estimated_fare: booking.estimated_fare,
            booking_status: booking.booking_status,
            vehicle_type: booking.vehicle_type,
          }
        : null,
    };
  }

  async listAssignments(
    driverId: string,
    limit: number,
    offset: number,
  ): Promise<AssignmentWithBooking[]> {
    const { data, error } = await supabaseServiceClient
      .from('driver_assignments')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !data) return [];

    const results: AssignmentWithBooking[] = [];
    for (const item of data) {
      const booking = await this.getBookingWithVehicle(item.booking_id);
      results.push({
        ...item,
        booking: booking
          ? {
              id: booking.id,
              pickup_address: booking.pickup_address,
              pickup_location: booking.pickup_location,
              destination_address: booking.destination_address,
              destination_location: booking.destination_location,
              estimated_fare: booking.estimated_fare,
              booking_status: booking.booking_status,
              vehicle_type: booking.vehicle_type,
            }
          : null,
      });
    }

    return results;
  }

  async acceptAssignment(
    assignmentId: string,
    driverId: string,
  ): Promise<{ status: string; trip_id: string; booking_id: string }> {
    // 1. Try atomic database RPC
    try {
      const { data, error } = await supabaseServiceClient.rpc('accept_driver_assignment', {
        p_assignment_id: assignmentId,
        p_driver_id: driverId,
      });

      if (!error && data) {
        const res = typeof data === 'string' ? JSON.parse(data) : data;
        return {
          status: 'accepted',
          trip_id: res.trip_id,
          booking_id: res.booking_id,
        };
      }

      if (error) {
        // Bubble up specific database exceptions
        const msg = error.message || '';
        if (msg.includes('ASSIGNMENT_EXPIRED')) {
          throw new Error('ASSIGNMENT_EXPIRED');
        }
        if (msg.includes('BOOKING_ALREADY_ASSIGNED')) {
          throw new Error('BOOKING_ALREADY_ASSIGNED');
        }
        if (msg.includes('DRIVER_HAS_ACTIVE_TRIP')) {
          throw new Error('DRIVER_HAS_ACTIVE_TRIP');
        }
        if (msg.includes('DRIVER_NOT_ONLINE')) {
          throw new Error('DRIVER_NOT_ONLINE');
        }
        if (msg.includes('ASSIGNMENT_NOT_OFFERED')) {
          throw new Error('ASSIGNMENT_NOT_OFFERED');
        }
        if (msg.includes('ASSIGNMENT_NOT_FOUND')) {
          throw new Error('ASSIGNMENT_NOT_FOUND');
        }
      }
    } catch (e: unknown) {
      if ((e as Error).message?.startsWith('ASSIGNMENT_') || (e as Error).message?.startsWith('BOOKING_') || (e as Error).message?.startsWith('DRIVER_')) {
        throw e;
      }
    }

    // 2. Direct database transaction fallback
    const { data: assignment, error: assignErr } = await supabaseServiceClient
      .from('driver_assignments')
      .select('*')
      .eq('id', assignmentId)
      .maybeSingle();

    if (assignErr || !assignment) {
      throw new Error('ASSIGNMENT_NOT_FOUND');
    }

    if (assignment.driver_id !== driverId) {
      throw new Error('UNAUTHORIZED_ASSIGNMENT');
    }

    if (assignment.assignment_status !== 'offered') {
      throw new Error('ASSIGNMENT_NOT_OFFERED');
    }

    if (assignment.expires_at && new Date(assignment.expires_at).getTime() <= Date.now()) {
      await supabaseServiceClient
        .from('driver_assignments')
        .update({ assignment_status: 'expired' })
        .eq('id', assignmentId);
      throw new Error('ASSIGNMENT_EXPIRED');
    }

    // Check driver state
    const { data: driver } = await supabaseServiceClient
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .maybeSingle();

    if (!driver || driver.availability_status !== 'online') {
      throw new Error('DRIVER_NOT_ONLINE');
    }

    // Check booking state
    const { data: booking } = await supabaseServiceClient
      .from('bookings')
      .select('*')
      .eq('id', assignment.booking_id)
      .maybeSingle();

    if (!booking || (booking.booking_status !== 'searching' && booking.booking_status !== 'pending')) {
      throw new Error('BOOKING_ALREADY_ASSIGNED');
    }

    // Check active trip
    const { data: activeTrips } = await supabaseServiceClient
      .from('trips')
      .select('id')
      .eq('driver_id', driverId)
      .in('trip_status', ['assigned', 'dispatched', 'arrived_at_pickup', 'vehicle_handover_pending', 'started']);

    if (activeTrips && activeTrips.length > 0) {
      throw new Error('DRIVER_HAS_ACTIVE_TRIP');
    }

    // Update assignment to accepted
    await supabaseServiceClient
      .from('driver_assignments')
      .update({ assignment_status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', assignmentId);

    // Cancel sibling offers
    await supabaseServiceClient
      .from('driver_assignments')
      .update({ assignment_status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('booking_id', booking.id)
      .neq('id', assignmentId)
      .eq('assignment_status', 'offered');

    // Update booking status
    await supabaseServiceClient
      .from('bookings')
      .update({ booking_status: 'assigned', updated_at: new Date().toISOString() })
      .eq('id', booking.id);

    // Create trip
    const { data: newTrip, error: tripError } = await supabaseServiceClient
      .from('trips')
      .insert({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        driver_id: driverId,
        vehicle_id: booking.vehicle_id,
        trip_status: 'assigned',
      })
      .select('id')
      .single();

    if (tripError || !newTrip) {
      throw tripError || new Error('Failed to create trip record');
    }

    // Update driver availability to on_trip
    await supabaseServiceClient
      .from('drivers')
      .update({ availability_status: 'on_trip', updated_at: new Date().toISOString() })
      .eq('id', driverId);

    return {
      status: 'accepted',
      trip_id: newTrip.id,
      booking_id: booking.id,
    };
  }

  async rejectAssignment(
    assignmentId: string,
    driverId: string,
    reason?: string,
  ): Promise<DriverAssignmentRow> {
    const { data: assignment, error: getErr } = await supabaseServiceClient
      .from('driver_assignments')
      .select('*')
      .eq('id', assignmentId)
      .maybeSingle();

    if (getErr || !assignment) {
      throw new Error('ASSIGNMENT_NOT_FOUND');
    }

    if (assignment.driver_id !== driverId) {
      throw new Error('UNAUTHORIZED_ASSIGNMENT');
    }

    const { data: updated, error: updateErr } = await supabaseServiceClient
      .from('driver_assignments')
      .update({
        assignment_status: 'rejected',
        rejection_reason: reason ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select('*')
      .single();

    if (updateErr || !updated) {
      throw updateErr || new Error('Failed to update assignment status');
    }

    return updated;
  }
}

export const assignmentsRepository = new AssignmentsRepository();
