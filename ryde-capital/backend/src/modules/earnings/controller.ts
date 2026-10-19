import type { Request, Response, NextFunction } from 'express';
import { earningsService } from './service.js';

export class EarningsController {
  async getEarnings(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await earningsService.getEarnings(req.user?.id || '', req.query);
    } catch (error) {
      next(error);
    }
  }
}

export const earningsController = new EarningsController();
