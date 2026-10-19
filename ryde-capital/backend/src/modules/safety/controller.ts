import type { Request, Response, NextFunction } from 'express';
import { safetyService } from './service.js';

export class SafetyController {
  async triggerTripSos(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await safetyService.triggerTripSos(req.user?.id || '', req.params['id'] || '', req.body);
    } catch (error) {
      next(error);
    }
  }

  async getEmergencyContacts(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await safetyService.getEmergencyContacts(req.user?.id || '');
    } catch (error) {
      next(error);
    }
  }

  async createEmergencyContact(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await safetyService.createEmergencyContact(req.user?.id || '', req.body);
    } catch (error) {
      next(error);
    }
  }
}

export const safetyController = new SafetyController();
