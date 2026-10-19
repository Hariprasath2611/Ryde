// ryde-capital/backend/src/modules/notifications/routes.ts
// Phase 5: Notifications & Device Token Routes

import { Router } from 'express';
import { notificationsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  getNotificationsQuerySchema,
  notificationIdParamSchema,
  registerDeviceTokenSchema,
} from './schema.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  validate({ query: getNotificationsQuerySchema }),
  (req, res, next) => {
    notificationsController.getNotifications(req, res, next);
  },
);

router.patch(
  '/:id/read',
  validate({ params: notificationIdParamSchema }),
  (req, res, next) => {
    notificationsController.markAsRead(req, res, next);
  },
);

router.post('/read-all', (req, res, next) => {
  notificationsController.markAllAsRead(req, res, next);
});

router.post(
  '/device-token',
  validate({ body: registerDeviceTokenSchema }),
  (req, res, next) => {
    notificationsController.registerDeviceToken(req, res, next);
  },
);

export const notificationRoutes = router;
