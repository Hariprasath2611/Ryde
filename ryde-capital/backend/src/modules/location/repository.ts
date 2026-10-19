export interface ILocationRepository {
  recordLocation(driverId: string, locationData: unknown): Promise<unknown>;
}

export class LocationRepository implements ILocationRepository {
  async recordLocation(_driverId: string, _locationData: unknown): Promise<unknown> {
    return null;
  }
}

export const locationRepository = new LocationRepository();
