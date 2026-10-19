import { Router } from 'express';
import { authController } from './controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();

router.get('/me', authMiddleware, (req, res, next) => {
  authController.getMe(req, res, next);
});

export const authRoutes = router;
