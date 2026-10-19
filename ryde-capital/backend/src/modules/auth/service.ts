import type { AuthUser } from '../../middleware/auth.js';
import { UnauthorizedError } from '@ryde/shared';

export interface CurrentUserResponse {
  id: string;
  role: string;
  email?: string;
}

export class AuthService {
  async getCurrentUser(user?: AuthUser): Promise<CurrentUserResponse> {
    if (!user) {
      throw new UnauthorizedError('User authentication context not found');
    }
    return {
      id: user.id,
      role: user.role,
      email: user.email,
    };
  }
}

export const authService = new AuthService();
