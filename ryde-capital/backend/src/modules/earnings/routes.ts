import { Router } from 'express';
import { earningsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { getEarningsQuerySchema } from './schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/', validate({ query: getEarningsQuerySchema }), (req, res, next) => {
  earningsController.getEarnings(req, res, next);
});

export const earningRoutes = router;
