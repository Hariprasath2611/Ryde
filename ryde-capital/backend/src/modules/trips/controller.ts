// ryde-capital/backend/src/modules/trips/controller.ts
// Phase 4 Express Controller for Trip Lifecycle & Navigation Endpoints

import type { Request, Response, NextFunction } from 'express';
import { tripsService } from './service.js';

export class TripsController {
  private getIdempotencyKey(req: Request): string | undefined {
    const headerKey = req.headers['idempotency-key'];
    if (typeof headerKey === 'string' && headerKey.trim().length > 0) {
      return headerKey.trim();
    }
    if (req.body && typeof req.body.idempotencyKey === 'string') {
      return req.body.idempotencyKey.trim();
    }
    return undefined;
  }

  async getTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || '';
      const tripId = req.params['id'] || '';
      const trip = await tripsService.getTrip(userId, tripId);
      res.status(200).json({ success: true, data: trip });
    } catch (error) {
      next(error);
    }
  }

  async listTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || '';
      const query = {
        page: req.query['page'] ? Number(req.query['page']) : 1,
        limit: req.query['limit'] ? Number(req.query['limit']) : 10,
        status: req.query['status'] as string | undefined,
      };
      const result = await tripsService.listTrips(userId, query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async startHeading(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || '';
      const tripId = req.params['id'] || '';
      const idempotencyKey = this.getIdempotencyKey(req);
      const result = await tripsService.startHeadingToPickup(userId, tripId, idempotencyKey);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async markArrived(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || '';
      const tripId = req.params['id'] || '';
      const idempotencyKey = this.getIdempotencyKey(req);
      const result = await tripsService.markArrived(userId, tripId, idempotencyKey);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async generateOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || '';
      const tripId = req.params['id'] || '';
      const result = await tripsService.generateOtp(userId, tripId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || '';
      const tripId = req.params['id'] || '';
      const idempotencyKey = this.getIdempotencyKey(req);
      const result = await tripsService.verifyOtp(userId, tripId, req.body, idempotencyKey);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async recordHandover(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || '';
      const tripId = req.params['id'] || '';
      const idempotencyKey = this.getIdempotencyKey(req);
      const result = await tripsService.recordHandover(userId, tripId, req.body, idempotencyKey);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async startTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || '';
      const tripId = req.params['id'] || '';
      const idempotencyKey = this.getIdempotencyKey(req);
      const result = await tripsService.startTrip(userId, tripId, idempotencyKey);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async endTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || '';
      const tripId = req.params['id'] || '';
      const idempotencyKey = this.getIdempotencyKey(req);
      const result = await tripsService.endTrip(userId, tripId, req.body, idempotencyKey);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async cancelTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || '';
      const tripId = req.params['id'] || '';
      const idempotencyKey = this.getIdempotencyKey(req);
      const result = await tripsService.cancelTrip(userId, tripId, req.body, idempotencyKey);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || '';
      const tripId = req.params['id'] || '';
      const route = await tripsService.getTripRoute(userId, tripId);
      res.status(200).json({ success: true, data: route });
    } catch (error) {
      next(error);
    }
  }

  async getContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || '';
      const tripId = req.params['id'] || '';
      const contact = await tripsService.getCustomerContact(userId, tripId);
      res.status(200).json({ success: true, data: contact });
    } catch (error) {
      next(error);
    }
  }

  async rateCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || '';
      const tripId = req.params['id'] || '';
      const result = await tripsService.rateCustomer(userId, tripId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const tripsController = new TripsController();

