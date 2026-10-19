import { Router } from 'express';
import { locationController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { locationInputSchema } from './schema.js';
import { locationRateLimiter } from '../../middleware/rateLimit.js';
import { ROLES } from '@ryde/shared';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(ROLES.DRIVER));
router.use(locationRateLimiter);

// Single or batch location update via POST /
router.post('/', validate({ body: locationInputSchema }), (req, res, next) => {
  locationController.updateLocation(req, res, next);
});

// Explicit batch endpoint via POST /batch
router.post('/batch', validate({ body: locationInputSchema }), (req, res, next) => {
  locationController.batchUpdateLocation(req, res, next);
});

// Mounted alias routes if reached via /api/v1/location
router.post('/location', validate({ body: locationInputSchema }), (req, res, next) => {
  locationController.updateLocation(req, res, next);
});

router.post('/location/batch', validate({ body: locationInputSchema }), (req, res, next) => {
  locationController.batchUpdateLocation(req, res, next);
});

export const locationRoutes = router;
