import type { Request, Response, NextFunction } from 'express';
import { availabilityService } from './service.js';

export class AvailabilityController {
  async getAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await availabilityService.getAvailability(req.user?.id || '');
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async setAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const target =
        req.body?.status !== undefined ? req.body.status : req.body?.isAvailable;
      const result = await availabilityService.setAvailability(
        req.user?.id || '',
        target,
      );
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const availabilityController = new AvailabilityController();
