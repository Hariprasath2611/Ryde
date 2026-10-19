import { Router } from 'express';
import { locationController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateLocationSchema } from './schema.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate({ body: updateLocationSchema }), (req, res, next) => {
  locationController.updateLocation(req, res, next);
});

router.post('/location', validate({ body: updateLocationSchema }), (req, res, next) => {
  locationController.updateLocation(req, res, next);
});

export const locationRoutes = router;
