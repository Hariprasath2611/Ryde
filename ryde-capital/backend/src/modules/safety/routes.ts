import { Router } from 'express';
import { safetyController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  tripSosParamSchema,
  triggerSosSchema,
  createEmergencyContactSchema,
} from './schema.js';

const router = Router();

router.use(authMiddleware);

router.post(
  '/trips/:id/sos',
  validate({ params: tripSosParamSchema, body: triggerSosSchema }),
  (req, res, next) => {
    safetyController.triggerTripSos(req, res, next);
  },
);

router.get('/emergency-contacts', (req, res, next) => {
  safetyController.getEmergencyContacts(req, res, next);
});

router.post(
  '/emergency-contacts',
  validate({ body: createEmergencyContactSchema }),
  (req, res, next) => {
    safetyController.createEmergencyContact(req, res, next);
  },
);

export const safetyRoutes = router;
