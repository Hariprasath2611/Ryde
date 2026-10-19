import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  AVAILABILITY_STATUS,
  type AvailabilityStatus,
} from '@ryde/shared';
import {
  availabilityRepository,
  type IAvailabilityRepository,
  type DriverRow,
} from './repository.js';

export interface SetAvailabilityResult {
  driverId: string;
  availabilityStatus: AvailabilityStatus;
  isAvailable: boolean;
}

export class AvailabilityService {
  constructor(private repo: IAvailabilityRepository = availabilityRepository) {}

  async getAvailability(userId: string): Promise<SetAvailabilityResult> {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    return {
      driverId: driver.id,
      availabilityStatus: driver.availability_status,
      isAvailable: driver.availability_status === AVAILABILITY_STATUS.ONLINE,
    };
  }

  async setAvailability(
    userId: string,
    target: boolean | 'online' | 'offline',
  ): Promise<SetAvailabilityResult> {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    // Rule: Only approved drivers may change availability
    if (
      driver.verification_status !== 'approved' ||
      driver.onboarding_status !== 'approved'
    ) {
      throw new ForbiddenError(
        'Driver onboarding is not approved yet. Only approved drivers can go online.',
      );
    }

    const isGoingOnline = target === true || target === 'online';
    const newStatus: AvailabilityStatus = isGoingOnline
      ? AVAILABILITY_STATUS.ONLINE
      : AVAILABILITY_STATUS.OFFLINE;

    if (isGoingOnline) {
      // Rule: Must have a recent location update (within 10 minutes) to go online
      const recentLoc = await this.repo.getDriverLocation(driver.id);
      if (!recentLoc) {
        throw new BadRequestError(
          'Cannot go online without a recent location update. Please enable GPS and stream location first.',
        );
      }

      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      const lastUpdate = new Date(recentLoc.updated_at).getTime();
      if (lastUpdate < tenMinutesAgo) {
        throw new BadRequestError(
          'Location is stale (older than 10 minutes). Please update your GPS location before going online.',
        );
      }
    } else {
      // Rule: Cannot go offline during an active trip
      const hasActive = await this.repo.hasActiveTrip(driver.id);
      if (hasActive) {
        throw new ConflictError('Cannot go offline while on an active trip.');
      }
    }

    const updated: DriverRow = await this.repo.setDriverAvailability(driver.id, newStatus);

    return {
      driverId: updated.id,
      availabilityStatus: updated.availability_status,
      isAvailable: updated.availability_status === AVAILABILITY_STATUS.ONLINE,
    };
  }
}

export const availabilityService = new AvailabilityService();
