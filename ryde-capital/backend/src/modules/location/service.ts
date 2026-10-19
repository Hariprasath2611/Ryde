import { NotImplementedError } from '@ryde/shared';

export class LocationService {
  async updateLocation(_driverId: string, _locationData: unknown): Promise<never> {
    throw new NotImplementedError('Driver location update is not implemented yet');
  }
}

export const locationService = new LocationService();
