import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  mapsService,
} from '@ryde/shared';
import {
  assignmentsRepository,
  type IAssignmentsRepository,
  type AssignmentWithBooking,
} from './repository.js';
import { parseLocation } from '../matching/geo.js';

export interface RoutePreviewResult {
  assignmentId: string;
  bookingId: string;
  polyline: string;
  distanceMeters: number;
  durationSeconds: number;
  pickupAddress: string;
  destinationAddress: string;
  pickupCoords: { latitude: number; longitude: number };
  destinationCoords: { latitude: number; longitude: number };
}

export class AssignmentsService {
  constructor(private repo: IAssignmentsRepository = assignmentsRepository) {}

  async listAssignments(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<{ activeOffer: AssignmentWithBooking | null; history: AssignmentWithBooking[] }> {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    const activeOffer = await this.repo.getActiveOffer(driver.id);
    const history = await this.repo.listAssignments(driver.id, limit, offset);

    return {
      activeOffer,
      history,
    };
  }

  async getRoutePreview(userId: string, assignmentId: string): Promise<RoutePreviewResult> {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    const assignment = await this.repo.getAssignmentById(assignmentId);
    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    if (assignment.driver_id !== driver.id) {
      throw new ForbiddenError('You are not authorized to view route for this assignment');
    }

    const booking = await this.repo.getBookingWithVehicle(assignment.booking_id);
    if (!booking) {
      throw new NotFoundError('Associated booking not found');
    }

    const pickupCoords = parseLocation(booking.pickup_location);
    const destinationCoords = parseLocation(booking.destination_location);

    const directions = await mapsService.getDirections(pickupCoords, destinationCoords);

    return {
      assignmentId: assignment.id,
      bookingId: booking.id,
      polyline: directions.polyline,
      distanceMeters: directions.distanceMeters,
      durationSeconds: directions.durationSeconds,
      pickupAddress: booking.pickup_address,
      destinationAddress: booking.destination_address,
      pickupCoords,
      destinationCoords,
    };
  }

  async acceptAssignment(
    userId: string,
    assignmentId: string,
  ): Promise<{ status: string; tripId: string; bookingId: string }> {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    try {
      const result = await this.repo.acceptAssignment(assignmentId, driver.id);
      return {
        status: result.status,
        tripId: result.trip_id,
        bookingId: result.booking_id,
      };
    } catch (err: unknown) {
      const msg = (err as Error).message || '';
      if (msg.includes('ASSIGNMENT_EXPIRED')) {
        throw new ConflictError('Offer has expired');
      }
      if (msg.includes('BOOKING_ALREADY_ASSIGNED')) {
        throw new ConflictError('Ride was already assigned to another driver');
      }
      if (msg.includes('DRIVER_HAS_ACTIVE_TRIP')) {
        throw new ConflictError('You already have an active trip in progress');
      }
      if (msg.includes('DRIVER_NOT_ONLINE')) {
        throw new BadRequestError('You must be online to accept ride offers');
      }
      if (msg.includes('ASSIGNMENT_NOT_OFFERED')) {
        throw new ConflictError('Assignment is not in offered status');
      }
      if (msg.includes('ASSIGNMENT_NOT_FOUND')) {
        throw new NotFoundError('Assignment not found');
      }
      if (msg.includes('UNAUTHORIZED_ASSIGNMENT')) {
        throw new ForbiddenError('This assignment was not offered to you');
      }
      throw err;
    }
  }

  async rejectAssignment(
    userId: string,
    assignmentId: string,
    reason?: string,
  ): Promise<{ status: string; assignmentId: string }> {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    try {
      const updated = await this.repo.rejectAssignment(assignmentId, driver.id, reason);
      return {
        status: updated.assignment_status,
        assignmentId: updated.id,
      };
    } catch (err: unknown) {
      const msg = (err as Error).message || '';
      if (msg.includes('ASSIGNMENT_NOT_FOUND')) {
        throw new NotFoundError('Assignment not found');
      }
      if (msg.includes('UNAUTHORIZED_ASSIGNMENT')) {
        throw new ForbiddenError('This assignment was not offered to you');
      }
      throw err;
    }
  }
}

export const assignmentsService = new AssignmentsService();
