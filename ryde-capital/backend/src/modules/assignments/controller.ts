import type { Request, Response, NextFunction } from 'express';
import { assignmentsService } from './service.js';

export class AssignmentsController {
  async listAssignments(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await assignmentsService.listAssignments(req.user?.id || '');
    } catch (error) {
      next(error);
    }
  }

  async acceptAssignment(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await assignmentsService.acceptAssignment(req.user?.id || '', req.params['id'] || '');
    } catch (error) {
      next(error);
    }
  }

  async rejectAssignment(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      await assignmentsService.rejectAssignment(
        req.user?.id || '',
        req.params['id'] || '',
        req.body?.reason,
      );
    } catch (error) {
      next(error);
    }
  }
}

export const assignmentsController = new AssignmentsController();
