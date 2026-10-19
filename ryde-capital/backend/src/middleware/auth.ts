import type { Request, Response, NextFunction } from 'express';
import { ROLES, type Role } from '@ryde/shared';
import { supabaseServiceClient } from '../config/supabase.js';

export interface AuthUser {
  id: string;
  phone?: string;
  email?: string;
  role: Role;
  metadata?: Record<string, unknown>;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or malformed authorization token',
        requestId: req.id || req.requestId || '',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization token required',
        requestId: req.id || req.requestId || '',
      },
    });
    return;
  }

  try {
    const { data, error } = await supabaseServiceClient.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired authorization token',
          requestId: req.id || req.requestId || '',
        },
      });
      return;
    }

    const appRole = data.user.app_metadata?.['role'] as Role | undefined;
    const userRole = data.user.user_metadata?.['role'] as Role | undefined;
    let role: Role = appRole || userRole || ROLES.CUSTOMER;

    // If still customer/unset, check if profile has role assigned
    if (!appRole && !userRole) {
      try {
        const { data: profile } = await supabaseServiceClient
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        if (profile?.role) {
          role = profile.role as Role;
        }
      } catch (_e) {
        // Fallback to customer if profile fetch fails
      }
    }

    req.user = {
      id: data.user.id,
      phone: data.user.phone,
      email: data.user.email,
      role,
      metadata: data.user.user_metadata,
    };

    next();
  } catch (_err) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Failed to authenticate token',
        requestId: req.id || req.requestId || '',
      },
    });
  }
}
