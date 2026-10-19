export interface IAvailabilityRepository {
  setAvailability(driverId: string, isAvailable: boolean): Promise<unknown>;
  getAvailability(driverId: string): Promise<unknown>;
}

export class AvailabilityRepository implements IAvailabilityRepository {
  async setAvailability(_driverId: string, _isAvailable: boolean): Promise<unknown> {
    return null;
  }

  async getAvailability(_driverId: string): Promise<unknown> {
    return null;
  }
}

export const availabilityRepository = new AvailabilityRepository();
