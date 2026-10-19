import { Router } from 'express';
import { locationController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { updateLocationSchema } from './schema.js';
import { ROLES } from '@ryde/shared';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(ROLES.DRIVER));

router.post('/', validate({ body: updateLocationSchema }), (req, res, next) => {
  locationController.updateLocation(req, res, next);
});

router.post('/location', validate({ body: updateLocationSchema }), (req, res, next) => {
  locationController.updateLocation(req, res, next);
});

export const locationRoutes = router;
