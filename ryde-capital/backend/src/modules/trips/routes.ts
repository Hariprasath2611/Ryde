import { Router } from 'express';
import { tripsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '@ryde/shared';
import {
  tripIdParamSchema,
  verifyOtpSchema,
  vehicleHandoverSchema,
  endTripSchema,
} from './schema.js';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(ROLES.DRIVER));

router.get('/:id', validate({ params: tripIdParamSchema }), (req, res, next) => {
  tripsController.getTrip(req, res, next);
});

router.post('/:id/arrived', validate({ params: tripIdParamSchema }), (req, res, next) => {
  tripsController.markArrived(req, res, next);
});

router.post('/:id/generate-otp', validate({ params: tripIdParamSchema }), (req, res, next) => {
  tripsController.generateOtp(req, res, next);
});

router.post(
  '/:id/verify-otp',
  validate({ params: tripIdParamSchema, body: verifyOtpSchema }),
  (req, res, next) => {
    tripsController.verifyOtp(req, res, next);
  },
);

router.post(
  '/:id/handover',
  validate({ params: tripIdParamSchema, body: vehicleHandoverSchema }),
  (req, res, next) => {
    tripsController.recordHandover(req, res, next);
  },
);

router.post('/:id/start', validate({ params: tripIdParamSchema }), (req, res, next) => {
  tripsController.startTrip(req, res, next);
});

router.post(
  '/:id/end',
  validate({ params: tripIdParamSchema, body: endTripSchema }),
  (req, res, next) => {
    tripsController.endTrip(req, res, next);
  },
);

export const tripRoutes = router;
