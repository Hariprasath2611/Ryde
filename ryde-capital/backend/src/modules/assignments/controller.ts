import type { Request, Response, NextFunction } from 'express';
import { assignmentsService } from './service.js';

export class AssignmentsController {
  async listAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 20;
      const offset = req.query['offset'] ? parseInt(req.query['offset'] as string, 10) : 0;
      const result = await assignmentsService.listAssignments(req.user?.id || '', limit, offset);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async getRoutePreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await assignmentsService.getRoutePreview(
        req.user?.id || '',
        req.params['id'] || '',
      );
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async acceptAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await assignmentsService.acceptAssignment(
        req.user?.id || '',
        req.params['id'] || '',
      );
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async rejectAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await assignmentsService.rejectAssignment(
        req.user?.id || '',
        req.params['id'] || '',
        req.body?.reason,
      );
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const assignmentsController = new AssignmentsController();
