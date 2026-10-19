// ryde-capital/backend/src/modules/safety/routes.ts
// Phase 5: Safety, SOS, Emergency Contacts, Live Trip Sharing & Admin SOS Routes

import { Router } from 'express';
import { safetyController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { publicTrackingRateLimiter } from '../../middleware/rateLimit.js';
import { ROLES } from '@ryde/shared';
import {
  tripSosParamSchema,
  sosIdParamSchema,
  contactIdParamSchema,
  shareTokenParamSchema,
  triggerSosSchema,
  cancelSosSchema,
  acknowledgeSosSchema,
  resolveSosSchema,
  createEmergencyContactSchema,
  updateEmergencyContactSchema,
} from './schema.js';

const router = Router();

// ==========================================================================
// 1. PUBLIC LIVE TRACKING (Unauthenticated, Rate Limited)
// ==========================================================================

router.get(
  '/public/track/:token',
  publicTrackingRateLimiter,
  validate({ params: shareTokenParamSchema }),
  (req, res, next) => {
    safetyController.getPublicTracking(req, res, next);
  },
);

router.get(
  '/public/track/:token/view',
  publicTrackingRateLimiter,
  validate({ params: shareTokenParamSchema }),
  (req, res, next) => {
    safetyController.renderPublicTrackingView(req, res, next);
  },
);

// ==========================================================================
// 2. ADMIN & SUPPORT SOS QUEUE (Authenticated, ADMIN or SUPPORT role)
// ==========================================================================

router.get(
  '/admin/sos',
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.SUPPORT),
  (req, res, next) => {
    safetyController.listOpenSos(req, res, next);
  },
);

router.post(
  '/admin/sos/:id/acknowledge',
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.SUPPORT),
  validate({ params: sosIdParamSchema, body: acknowledgeSosSchema }),
  (req, res, next) => {
    safetyController.acknowledgeSos(req, res, next);
  },
);

router.post(
  '/admin/sos/:id/resolve',
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.SUPPORT),
  validate({ params: sosIdParamSchema, body: resolveSosSchema }),
  (req, res, next) => {
    safetyController.resolveSos(req, res, next);
  },
);

// ==========================================================================
// 3. DRIVER EMERGENCY CONTACTS & SOS (Authenticated, DRIVER role)
// ==========================================================================

router.post(
  '/trips/:id/sos',
  authMiddleware,
  requireRole(ROLES.DRIVER),
  validate({ params: tripSosParamSchema, body: triggerSosSchema }),
  (req, res, next) => {
    safetyController.triggerTripSos(req, res, next);
  },
);

router.post(
  '/sos/:id/cancel',
  authMiddleware,
  requireRole(ROLES.DRIVER),
  validate({ params: sosIdParamSchema, body: cancelSosSchema }),
  (req, res, next) => {
    safetyController.cancelTripSos(req, res, next);
  },
);

router.post(
  '/trips/:id/share',
  authMiddleware,
  requireRole(ROLES.DRIVER),
  validate({ params: tripSosParamSchema }),
  (req, res, next) => {
    safetyController.createTripShare(req, res, next);
  },
);

router.get(
  '/emergency-contacts',
  authMiddleware,
  requireRole(ROLES.DRIVER),
  (req, res, next) => {
    safetyController.getEmergencyContacts(req, res, next);
  },
);

router.post(
  '/emergency-contacts',
  authMiddleware,
  requireRole(ROLES.DRIVER),
  validate({ body: createEmergencyContactSchema }),
  (req, res, next) => {
    safetyController.createEmergencyContact(req, res, next);
  },
);

router.patch(
  '/emergency-contacts/:id',
  authMiddleware,
  requireRole(ROLES.DRIVER),
  validate({ params: contactIdParamSchema, body: updateEmergencyContactSchema }),
  (req, res, next) => {
    safetyController.updateEmergencyContact(req, res, next);
  },
);

router.delete(
  '/emergency-contacts/:id',
  authMiddleware,
  requireRole(ROLES.DRIVER),
  validate({ params: contactIdParamSchema }),
  (req, res, next) => {
    safetyController.deleteEmergencyContact(req, res, next);
  },
);

export const safetyRoutes = router;
