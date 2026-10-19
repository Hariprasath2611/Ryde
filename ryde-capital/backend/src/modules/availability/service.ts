import { NotImplementedError } from '@ryde/shared';

export class AvailabilityService {
  async setAvailability(_driverId: string, _isAvailable: boolean): Promise<never> {
    throw new NotImplementedError('Driver availability update is not implemented yet');
  }
}

export const availabilityService = new AvailabilityService();
