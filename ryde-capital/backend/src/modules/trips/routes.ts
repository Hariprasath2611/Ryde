// ryde-capital/backend/src/modules/trips/routes.ts
// Phase 4 Express Router for Trip Endpoints

import { Router } from 'express';
import { tripsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '@ryde/shared';
import {
  tripIdParamSchema,
  tripHistoryQuerySchema,
  verifyOtpSchema,
  vehicleHandoverSchema,
  endTripSchema,
  cancelTripSchema,
  rateCustomerSchema,
} from './schema.js';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(ROLES.DRIVER));

// List trip history
router.get(
  '/',
  validate({ query: tripHistoryQuerySchema }),
  (req, res, next) => {
    tripsController.listTrips(req, res, next);
  },
);

// Get trip details
router.get(
  '/:id',
  validate({ params: tripIdParamSchema }),
  (req, res, next) => {
    tripsController.getTrip(req, res, next);
  },
);

// Start heading to pickup
router.post(
  '/:id/start-heading',
  validate({ params: tripIdParamSchema }),
  (req, res, next) => {
    tripsController.startHeading(req, res, next);
  },
);

// Arrive at pickup (geofenced)
router.post(
  '/:id/arrived',
  validate({ params: tripIdParamSchema }),
  (req, res, next) => {
    tripsController.markArrived(req, res, next);
  },
);

// Generate trip OTP (delivered to dev outbox)
router.post(
  '/:id/generate-otp',
  validate({ params: tripIdParamSchema }),
  (req, res, next) => {
    tripsController.generateOtp(req, res, next);
  },
);

// Verify trip OTP
router.post(
  '/:id/verify-otp',
  validate({ params: tripIdParamSchema, body: verifyOtpSchema }),
  (req, res, next) => {
    tripsController.verifyOtp(req, res, next);
  },
);

// Vehicle handover inspection with photos
router.post(
  '/:id/handover',
  validate({ params: tripIdParamSchema, body: vehicleHandoverSchema }),
  (req, res, next) => {
    tripsController.recordHandover(req, res, next);
  },
);

// Start trip journey
router.post(
  '/:id/start',
  validate({ params: tripIdParamSchema }),
  (req, res, next) => {
    tripsController.startTrip(req, res, next);
  },
);

// End trip journey & compute fare
router.post(
  '/:id/end',
  validate({ params: tripIdParamSchema, body: endTripSchema }),
  (req, res, next) => {
    tripsController.endTrip(req, res, next);
  },
);

// Driver cancel before start
router.post(
  '/:id/cancel',
  validate({ params: tripIdParamSchema, body: cancelTripSchema }),
  (req, res, next) => {
    tripsController.cancelTrip(req, res, next);
  },
);

// Cached route directions
router.get(
  '/:id/route',
  validate({ params: tripIdParamSchema }),
  (req, res, next) => {
    tripsController.getRoute(req, res, next);
  },
);

// Customer contact (active trips only)
router.get(
  '/:id/contact',
  validate({ params: tripIdParamSchema }),
  (req, res, next) => {
    tripsController.getContact(req, res, next);
  },
);

// Rate customer (completed trips only, Phase 5)
router.post(
  '/:id/rating',
  validate({ params: tripIdParamSchema, body: rateCustomerSchema }),
  (req, res, next) => {
    tripsController.rateCustomer(req, res, next);
  },
);

export const tripRoutes = router;

