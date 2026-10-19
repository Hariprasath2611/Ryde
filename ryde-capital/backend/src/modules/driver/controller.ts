import type { Request, Response, NextFunction } from 'express';
import { driverService } from './service.js';

export class DriverController {
  async getProfile(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await driverService.getProfile(req.user?.id || '');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await driverService.updateProfile(req.user?.id || '', req.body);
    } catch (error) {
      next(error);
    }
  }

  async uploadDocument(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await driverService.uploadDocument(req.user?.id || '', req.body);
    } catch (error) {
      next(error);
    }
  }
}

export const driverController = new DriverController();
