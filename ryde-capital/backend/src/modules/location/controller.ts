import type { Request, Response, NextFunction } from 'express';
import { locationService } from './service.js';

export class LocationController {
  async updateLocation(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await locationService.updateLocation(req.user?.id || '', req.body);
    } catch (error) {
      next(error);
    }
  }
}

export const locationController = new LocationController();
