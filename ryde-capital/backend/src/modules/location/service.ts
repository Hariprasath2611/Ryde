import {
  BadRequestError,
  NotFoundError,
} from '@ryde/shared';
import {
  locationRepository,
  type ILocationRepository,
  type ValidatedLocationPoint,
} from './repository.js';
import type { LocationPointInput } from './schema.js';

export interface LocationUpdateResult {
  accepted: number;
  dropped: number;
  latest: ValidatedLocationPoint | null;
}

export class LocationService {
  constructor(private repo: ILocationRepository = locationRepository) {}

  private validatePoint(raw: LocationPointInput): ValidatedLocationPoint | null {
    // 1. Validate coordinate bounds
    if (raw.latitude < -90 || raw.latitude > 90) {
      throw new BadRequestError('Invalid latitude: must be between -90 and 90 degrees');
    }
    if (raw.longitude < -180 || raw.longitude > 180) {
      throw new BadRequestError('Invalid longitude: must be between -180 and 180 degrees');
    }

    // 2. Validate timestamp
    const recordedRaw = raw.recorded_at ?? raw.recordedAt ?? Date.now();
    const recordedTimestamp =
      typeof recordedRaw === 'string' ? new Date(recordedRaw).getTime() : recordedRaw;

    if (isNaN(recordedTimestamp)) {
      throw new BadRequestError('Invalid recorded_at timestamp format');
    }

    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;
    const thirtySecondsAhead = now + 30 * 1000;

    if (recordedTimestamp < tenMinutesAgo) {
      throw new BadRequestError('Location timestamp is too stale (older than 10 minutes)');
    }
    if (recordedTimestamp > thirtySecondsAhead) {
      throw new BadRequestError('Location timestamp cannot be in the future (> 30s)');
    }

    // 3. Validate impossible speed (> 150 km/h)
    if (raw.speed !== undefined && raw.speed !== null) {
      if (raw.speed > 150) {
        throw new BadRequestError('Impossible speed reported (> 150 km/h)');
      }
    }

    // 4. Drop low accuracy points (> 50 meters)
    if (raw.accuracy !== undefined && raw.accuracy !== null && raw.accuracy > 50) {
      return null; // Dropped due to low accuracy
    }

    return {
      latitude: raw.latitude,
      longitude: raw.longitude,
      heading: raw.heading ?? null,
      speed: raw.speed ?? null,
      accuracy: raw.accuracy ?? null,
      recordedAt: new Date(recordedTimestamp).toISOString(),
    };
  }

  async updateLocation(userId: string, input: unknown): Promise<LocationUpdateResult> {
    const driver = await this.repo.getDriverByUserId(userId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    let rawPoints: LocationPointInput[] = [];

    if (Array.isArray(input)) {
      rawPoints = input as LocationPointInput[];
    } else if (typeof input === 'object' && input !== null && 'locations' in input) {
      rawPoints = (input as { locations: LocationPointInput[] }).locations;
    } else if (typeof input === 'object' && input !== null) {
      rawPoints = [input as LocationPointInput];
    } else {
      throw new BadRequestError('Invalid location payload format');
    }

    if (rawPoints.length === 0) {
      throw new BadRequestError('At least one location point must be provided');
    }

    if (rawPoints.length > 20) {
      throw new BadRequestError('Batch size cannot exceed 20 location points');
    }

    const validated: ValidatedLocationPoint[] = [];
    let droppedCount = 0;

    for (const raw of rawPoints) {
      const pt = this.validatePoint(raw);
      if (pt) {
        validated.push(pt);
      } else {
        droppedCount++;
      }
    }

    if (validated.length === 0) {
      return {
        accepted: 0,
        dropped: droppedCount,
        latest: null,
      };
    }

    // Sort by recordedAt ascending
    validated.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    // Record points
    await this.repo.recordLocations(driver.id, validated);

    return {
      accepted: validated.length,
      dropped: droppedCount,
      latest: validated[validated.length - 1] ?? null,
    };
  }
}

export const locationService = new LocationService();
