// ryde-capital/backend/src/modules/admin/controller.ts
// Express controller for Admin verification and review endpoints

import type { Request, Response, NextFunction } from 'express';
import { adminService } from './service.js';
import type { DriverOnboardingStatus } from '@ryde/shared';

export class AdminController {
  async listDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query['status'] as DriverOnboardingStatus | undefined;
      const page = req.query['page'] ? Number(req.query['page']) : 1;
      const limit = req.query['limit'] ? Number(req.query['limit']) : 20;

      const result = await adminService.listDrivers(req.user?.id || '', status, page, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { driverId } = req.params;
      const result = await adminService.getDriverReviewDetails(req.user?.id || '', driverId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async approveDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { driverId } = req.params;
      const result = await adminService.approveDriver(req.user?.id || '', driverId!);
      res.status(200).json({
        message: 'Driver approved successfully',
        driver: result.driver,
        profile: result.profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { driverId } = req.params;
      const { reason } = req.body;
      const result = await adminService.rejectDriver(req.user?.id || '', driverId!, reason);
      res.status(200).json({
        message: 'Driver verification rejected',
        driver: result.driver,
        profile: result.profile,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
