import { Router } from 'express';
import { driverController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { updateDriverProfileSchema, uploadDocumentSchema } from './schema.js';
import { ROLES } from '@ryde/shared';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(ROLES.DRIVER));

router.get('/me', (req, res, next) => {
  driverController.getProfile(req, res, next);
});

router.patch('/me', validate({ body: updateDriverProfileSchema }), (req, res, next) => {
  driverController.updateProfile(req, res, next);
});

router.post('/me/documents', validate({ body: uploadDocumentSchema }), (req, res, next) => {
  driverController.uploadDocument(req, res, next);
});

export const driverRoutes = router;
