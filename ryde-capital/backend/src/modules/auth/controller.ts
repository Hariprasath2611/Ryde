import type { Request, Response, NextFunction } from 'express';
import { authService } from './service.js';

export class AuthController {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getCurrentUser(req.user);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
