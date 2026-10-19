import type { Request, Response, NextFunction } from 'express';
import { availabilityService } from './service.js';

export class AvailabilityController {
  async setAvailability(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await availabilityService.setAvailability(req.user?.id || '', req.body?.isAvailable);
    } catch (error) {
      next(error);
    }
  }
}

export const availabilityController = new AvailabilityController();
