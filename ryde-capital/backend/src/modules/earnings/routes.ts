import { Router } from 'express';
import { earningsController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  getEarningsQuerySchema,
  createPayoutAccountSchema,
  payoutAccountIdParamSchema,
} from './schema.js';
import { ROLES } from '@ryde/shared';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(ROLES.DRIVER));

router.get('/summary', (req, res, next) => {
  earningsController.getEarningsSummary(req, res, next);
});

router.get('/', validate({ query: getEarningsQuerySchema }), (req, res, next) => {
  earningsController.getEarnings(req, res, next);
});

router.get('/payout-accounts', (req, res, next) => {
  earningsController.getPayoutAccounts(req, res, next);
});

router.post(
  '/payout-accounts',
  validate({ body: createPayoutAccountSchema }),
  (req, res, next) => {
    earningsController.createPayoutAccount(req, res, next);
  },
);

router.patch(
  '/payout-accounts/:id/default',
  validate({ params: payoutAccountIdParamSchema }),
  (req, res, next) => {
    earningsController.setDefaultPayoutAccount(req, res, next);
  },
);

router.delete(
  '/payout-accounts/:id',
  validate({ params: payoutAccountIdParamSchema }),
  (req, res, next) => {
    earningsController.deletePayoutAccount(req, res, next);
  },
);

export const earningRoutes = router;

