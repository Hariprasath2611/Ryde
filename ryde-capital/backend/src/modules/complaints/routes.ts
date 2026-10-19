// ryde-capital/backend/src/modules/complaints/routes.ts
// Phase 5: Complaints Express Router

import { Router } from 'express';
import { complaintsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createComplaintSchema,
  getComplaintsQuerySchema,
} from './schema.js';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  validate({ body: createComplaintSchema }),
  (req, res, next) => {
    complaintsController.fileComplaint(req, res, next);
  },
);

router.get(
  '/',
  validate({ query: getComplaintsQuerySchema }),
  (req, res, next) => {
    complaintsController.getComplaints(req, res, next);
  },
);

export const complaintRoutes = router;
