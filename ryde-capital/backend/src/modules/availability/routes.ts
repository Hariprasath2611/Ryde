import { Router } from 'express';
import { availabilityController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { setAvailabilitySchema } from './schema.js';

const router = Router();

router.use(authMiddleware);

// Supports both direct mount PUT / and mounted path /availability or /drivers/me/availability
router.put('/', validate({ body: setAvailabilitySchema }), (req, res, next) => {
  availabilityController.setAvailability(req, res, next);
});

router.put('/availability', validate({ body: setAvailabilitySchema }), (req, res, next) => {
  availabilityController.setAvailability(req, res, next);
});

export const availabilityRoutes = router;
