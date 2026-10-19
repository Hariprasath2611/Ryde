// ryde-capital/backend/src/modules/driver/routes.ts
// Driver onboarding, profile management, and document submission routes

import { Router } from 'express';
import { driverController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { uploadRateLimiter } from '../../middleware/rateLimit.js';
import {
  updateDriverProfileSchema,
  createUploadUrlSchema,
  confirmDocumentSchema,
} from './schema.js';
import { ROLES } from '@ryde/shared';

const router = Router();

// All driver routes require authenticated token with DRIVER role
router.use(authMiddleware);
router.use(requireRole(ROLES.DRIVER));

// GET /api/v1/drivers/me (profile + 5-step onboarding checklist)
router.get('/me', (req, res, next) => {
  driverController.getProfile(req, res, next);
});

// PATCH /api/v1/drivers/me (personal details & vehicle types)
router.patch('/me', validate({ body: updateDriverProfileSchema }), (req, res, next) => {
  driverController.updateProfile(req, res, next);
});

// POST /api/v1/drivers/me/documents/upload-url (short-lived signed URL for direct client upload)
router.post(
  '/me/documents/upload-url',
  uploadRateLimiter,
  validate({ body: createUploadUrlSchema }),
  (req, res, next) => {
    driverController.createUploadUrl(req, res, next);
  },
);

// POST /api/v1/drivers/me/documents (confirm uploaded document and persist in registry)
router.post(
  '/me/documents',
  uploadRateLimiter,
  validate({ body: confirmDocumentSchema }),
  (req, res, next) => {
    driverController.confirmDocument(req, res, next);
  },
);

// POST /api/v1/drivers/me/submit-for-review (validates checklist completion and transitions to submitted)
router.post('/me/submit-for-review', (req, res, next) => {
  driverController.submitForReview(req, res, next);
});

export const driverRoutes = router;
