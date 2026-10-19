// ryde-capital/backend/src/modules/earnings/controller.ts
// Phase 5: Earnings and Payout Accounts Controller

import type { Request, Response, NextFunction } from 'express';
import { earningsService } from './service.js';
import type { CreatePayoutAccountInput, GetEarningsQueryInput } from './schema.js';

export class EarningsController {
  async getEarningsSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await earningsService.getEarningsSummary(req.user?.id || '');
      res.status(200).json({ data: summary });
    } catch (error) {
      next(error);
    }
  }

  async getEarnings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as GetEarningsQueryInput;
      const result = await earningsService.getEarningsList(req.user?.id || '', query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPayoutAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accounts = await earningsService.getPayoutAccounts(req.user?.id || '');
      res.status(200).json({ data: accounts });
    } catch (error) {
      next(error);
    }
  }

  async createPayoutAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreatePayoutAccountInput;
      const account = await earningsService.createPayoutAccount(req.user?.id || '', input);
      res.status(201).json({ data: account });
    } catch (error) {
      next(error);
    }
  }

  async setDefaultPayoutAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await earningsService.setDefaultPayoutAccount(req.user?.id || '', id!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deletePayoutAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await earningsService.deletePayoutAccount(req.user?.id || '', id!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const earningsController = new EarningsController();
