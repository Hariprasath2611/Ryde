// ryde-capital/backend/src/modules/driver/controller.ts
// Express controller for Phase 2 driver onboarding endpoints

import type { Request, Response, NextFunction } from 'express';
import { driverService } from './service.js';

export class DriverController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await driverService.getProfile(req.user?.id || '');
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await driverService.updateProfile(req.user?.id || '', req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async createUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await driverService.createUploadUrl(req.user?.id || '', req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async confirmDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await driverService.confirmDocument(req.user?.id || '', req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async submitForReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await driverService.submitForReview(req.user?.id || '');
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const driverController = new DriverController();
