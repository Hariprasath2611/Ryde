import { Router } from 'express';
import { assignmentsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  assignmentIdParamSchema,
  rejectAssignmentSchema,
  listAssignmentsQuerySchema,
} from './schema.js';
import { ROLES } from '@ryde/shared';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(ROLES.DRIVER));

// GET /api/v1/assignments (active offer + paginated history)
router.get('/', validate({ query: listAssignmentsQuerySchema }), (req, res, next) => {
  assignmentsController.listAssignments(req, res, next);
});

// GET /api/v1/assignments/:id/route (cached route polyline for "Preview full route" modal)
router.get('/:id/route', validate({ params: assignmentIdParamSchema }), (req, res, next) => {
  assignmentsController.getRoutePreview(req, res, next);
});

// POST /api/v1/assignments/:id/accept (atomic accept transaction)
router.post('/:id/accept', validate({ params: assignmentIdParamSchema }), (req, res, next) => {
  assignmentsController.acceptAssignment(req, res, next);
});

// POST /api/v1/assignments/:id/reject (optional rejection reason)
router.post(
  '/:id/reject',
  validate({ params: assignmentIdParamSchema, body: rejectAssignmentSchema }),
  (req, res, next) => {
    assignmentsController.rejectAssignment(req, res, next);
  },
);

export const assignmentRoutes = router;
