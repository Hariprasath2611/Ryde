import { Router } from 'express';
import { availabilityController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { setAvailabilitySchema } from './schema.js';
import { ROLES } from '@ryde/shared';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(ROLES.DRIVER));

// GET /api/v1/drivers/me/availability
router.get('/', (req, res, next) => {
  availabilityController.getAvailability(req, res, next);
});

router.get('/availability', (req, res, next) => {
  availabilityController.getAvailability(req, res, next);
});

// PUT /api/v1/drivers/me/availability
router.put('/', validate({ body: setAvailabilitySchema }), (req, res, next) => {
  availabilityController.setAvailability(req, res, next);
});

router.put('/availability', validate({ body: setAvailabilitySchema }), (req, res, next) => {
  availabilityController.setAvailability(req, res, next);
});

export const availabilityRoutes = router;
