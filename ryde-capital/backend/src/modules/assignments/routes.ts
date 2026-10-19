import { Router } from 'express';
import { assignmentsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { assignmentIdParamSchema, rejectAssignmentSchema } from './schema.js';
import { ROLES } from '@ryde/shared';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(ROLES.DRIVER));

router.get('/', (req, res, next) => {
  assignmentsController.listAssignments(req, res, next);
});

router.post('/:id/accept', validate({ params: assignmentIdParamSchema }), (req, res, next) => {
  assignmentsController.acceptAssignment(req, res, next);
});

router.post(
  '/:id/reject',
  validate({ params: assignmentIdParamSchema, body: rejectAssignmentSchema }),
  (req, res, next) => {
    assignmentsController.rejectAssignment(req, res, next);
  },
);

export const assignmentRoutes = router;
