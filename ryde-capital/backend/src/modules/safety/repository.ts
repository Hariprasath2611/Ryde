export interface ISafetyRepository {
  createSosEvent(event: unknown): Promise<unknown>;
  getEmergencyContacts(driverId: string): Promise<unknown[]>;
  createEmergencyContact(driverId: string, contact: unknown): Promise<unknown>;
}

export class SafetyRepository implements ISafetyRepository {
  async createSosEvent(_event: unknown): Promise<unknown> {
    return null;
  }

  async getEmergencyContacts(_driverId: string): Promise<unknown[]> {
    return [];
  }

  async createEmergencyContact(_driverId: string, _contact: unknown): Promise<unknown> {
    return null;
  }
}

export const safetyRepository = new SafetyRepository();
