// ryde-capital/backend/src/modules/complaints/controller.ts
// Phase 5: Complaints Controller

import type { Request, Response, NextFunction } from 'express';
import { complaintsService } from './service.js';
import type {
  CreateComplaintInput,
  GetComplaintsQueryInput,
} from './schema.js';

export class ComplaintsController {
  async fileComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateComplaintInput;
      const complaint = await complaintsService.fileComplaint(req.user?.id || '', input);
      res.status(201).json({ success: true, data: complaint });
    } catch (error) {
      next(error);
    }
  }

  async getComplaints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as GetComplaintsQueryInput;
      const result = await complaintsService.getComplaints(req.user?.id || '', query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const complaintsController = new ComplaintsController();
