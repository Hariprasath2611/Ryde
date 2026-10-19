import { NotImplementedError } from '@ryde/shared';

export class SafetyService {
  async triggerTripSos(_driverId: string, _tripId: string, _data: unknown): Promise<never> {
    throw new NotImplementedError('SOS alert dispatch is not implemented yet');
  }

  async getEmergencyContacts(_driverId: string): Promise<never> {
    throw new NotImplementedError('Emergency contacts retrieval is not implemented yet');
  }

  async createEmergencyContact(_driverId: string, _data: unknown): Promise<never> {
    throw new NotImplementedError('Emergency contact creation is not implemented yet');
  }
}

export const safetyService = new SafetyService();
