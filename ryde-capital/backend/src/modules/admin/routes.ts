// ryde-capital/backend/src/modules/admin/routes.ts
// Admin driver review and onboarding decision routes

import { Router } from 'express';
import { adminController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { listDriversQuerySchema, rejectDriverSchema } from './schema.js';
import { ROLES } from '@ryde/shared';

const router = Router();

// Strictly restricted to admin and support roles
router.use(authMiddleware);
router.use(requireRole(ROLES.ADMIN, ROLES.SUPPORT));

// GET /api/v1/admin/drivers (list drivers with pagination and status filter)
router.get('/drivers', validate({ query: listDriversQuerySchema }), (req, res, next) => {
  adminController.listDrivers(req, res, next);
});

// GET /api/v1/admin/drivers/:driverId (review driver with 60s signed document URLs)
router.get('/drivers/:driverId', (req, res, next) => {
  adminController.getDriver(req, res, next);
});

// POST /api/v1/admin/drivers/:driverId/approve (approves onboarding & sends driver notification)
router.post('/drivers/:driverId/approve', (req, res, next) => {
  adminController.approveDriver(req, res, next);
});

// POST /api/v1/admin/drivers/:driverId/reject (rejects onboarding with reason & sends notification)
router.post(
  '/drivers/:driverId/reject',
  validate({ body: rejectDriverSchema }),
  (req, res, next) => {
    adminController.rejectDriver(req, res, next);
  },
);

export const adminRoutes = router;
