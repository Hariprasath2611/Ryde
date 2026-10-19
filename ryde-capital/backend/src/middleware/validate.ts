import type { Request, Response, NextFunction } from 'express';
import type { AnyZodObject } from 'zod';

export interface ValidationSchemas {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export function validate(schemas: ValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (error: unknown) {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Request validation failed',
          requestId: req.id || req.requestId || '',
          details: error,
        },
      });
    }
  };
}
