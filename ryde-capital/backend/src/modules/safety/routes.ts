import { Router } from 'express';
import { safetyController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { tripSosParamSchema, triggerSosSchema, createEmergencyContactSchema } from './schema.js';
import { ROLES } from '@ryde/shared';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(ROLES.DRIVER));

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
