import { Router } from 'express';
import { authController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { authRateLimiter } from '../../middleware/rateLimit.js';
import { completeSignupSchema } from './schema.js';

const router = Router();

// Apply strict rate limiting across auth endpoints
router.use(authRateLimiter);

router.get('/me', authMiddleware, (req, res, next) => {
  authController.getMe(req, res, next);
});

router.post(
  '/complete-signup',
  authMiddleware,
  validate({ body: completeSignupSchema }),
  (req, res, next) => {
    authController.completeSignup(req, res, next);
  },
);

export const authRoutes = router;
