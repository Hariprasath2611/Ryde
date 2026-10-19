import type { Request, Response, NextFunction } from 'express';
import { locationService } from './service.js';

export class LocationController {
  async updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await locationService.updateLocation(req.user?.id || '', req.body);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async batchUpdateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await locationService.updateLocation(req.user?.id || '', req.body);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const locationController = new LocationController();
