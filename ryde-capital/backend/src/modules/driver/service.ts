import { NotImplementedError } from '@ryde/shared';

export class DriverService {
  async getProfile(_driverId: string): Promise<never> {
    throw new NotImplementedError('Driver profile retrieval is not implemented yet');
  }

  async updateProfile(_driverId: string, _data: unknown): Promise<never> {
    throw new NotImplementedError('Driver profile update is not implemented yet');
  }

  async uploadDocument(_driverId: string, _data: unknown): Promise<never> {
    throw new NotImplementedError('Driver document upload is not implemented yet');
  }
}

export const driverService = new DriverService();
