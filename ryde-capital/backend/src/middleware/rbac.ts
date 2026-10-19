import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@ryde/shared';

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required before role check',
          requestId: req.id || req.requestId || '',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`,
          requestId: req.id || req.requestId || '',
        },
      });
      return;
    }

    next();
  };
}
