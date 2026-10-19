// ryde-capital/backend/src/modules/notifications/controller.ts
// Phase 5: Notifications Controller

import type { Request, Response, NextFunction } from 'express';
import { notificationsService } from './service.js';
import type {
  GetNotificationsQueryInput,
  RegisterDeviceTokenInput,
} from './schema.js';

export class NotificationsController {
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as GetNotificationsQueryInput;
      const result = await notificationsService.getNotifications(req.user?.id || '', query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await notificationsService.markAsRead(req.user?.id || '', id!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notificationsService.markAllAsRead(req.user?.id || '');
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async registerDeviceToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as RegisterDeviceTokenInput;
      const result = await notificationsService.registerDeviceToken(
        req.user?.id || '',
        input.token,
        input.platform,
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();
