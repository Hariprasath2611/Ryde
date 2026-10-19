import type { Request, Response, NextFunction } from 'express';
import { tripsService } from './service.js';

export class TripsController {
  async getTrip(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await tripsService.getTrip(req.params['id'] || '');
    } catch (error) {
      next(error);
    }
  }

  async markArrived(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await tripsService.markArrived(req.params['id'] || '');
    } catch (error) {
      next(error);
    }
  }

  async generateOtp(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await tripsService.generateOtp(req.params['id'] || '');
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await tripsService.verifyOtp(req.params['id'] || '', req.body?.otp);
    } catch (error) {
      next(error);
    }
  }

  async recordHandover(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await tripsService.recordHandover(req.params['id'] || '', req.body);
    } catch (error) {
      next(error);
    }
  }

  async startTrip(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await tripsService.startTrip(req.params['id'] || '');
    } catch (error) {
      next(error);
    }
  }

  async endTrip(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await tripsService.endTrip(req.params['id'] || '', req.body);
    } catch (error) {
      next(error);
    }
  }
}

export const tripsController = new TripsController();
