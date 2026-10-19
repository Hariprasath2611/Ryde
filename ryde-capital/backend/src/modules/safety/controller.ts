// ryde-capital/backend/src/modules/safety/controller.ts
// Phase 5: Safety, Emergency Contacts, SOS & Live Trip Sharing Controller

import type { Request, Response, NextFunction } from 'express';
import { safetyService } from './service.js';
import type {
  TriggerSosInput,
  CancelSosInput,
  AcknowledgeSosInput,
  ResolveSosInput,
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
} from './schema.js';

export class SafetyController {
  // ==========================================================================
  // Emergency Contacts
  // ==========================================================================

  async getEmergencyContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contacts = await safetyService.getEmergencyContacts(req.user?.id || '');
      res.status(200).json({ success: true, data: contacts });
    } catch (error) {
      next(error);
    }
  }

  async createEmergencyContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateEmergencyContactInput;
      const contact = await safetyService.createEmergencyContact(req.user?.id || '', input);
      res.status(201).json({ success: true, data: contact });
    } catch (error) {
      next(error);
    }
  }

  async updateEmergencyContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contactId = req.params['id'] || '';
      const input = req.body as UpdateEmergencyContactInput;
      const updated = await safetyService.updateEmergencyContact(req.user?.id || '', contactId, input);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  async deleteEmergencyContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contactId = req.params['id'] || '';
      const result = await safetyService.deleteEmergencyContact(req.user?.id || '', contactId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================================================
  // SOS Alerts
  // ==========================================================================

  async triggerTripSos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tripId = req.params['id'] || '';
      const input = req.body as TriggerSosInput;
      const result = await safetyService.triggerTripSos(req.user?.id || '', tripId, input);
      const status = result.deduped ? 200 : 201;
      res.status(status).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async cancelTripSos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sosId = req.params['id'] || '';
      const input = req.body as CancelSosInput;
      const result = await safetyService.cancelTripSos(req.user?.id || '', sosId, input?.reason);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================================================
  // Trip Sharing & Public Tracking
  // ==========================================================================

  async createTripShare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tripId = req.params['id'] || '';
      const share = await safetyService.createTripShare(req.user?.id || '', tripId);
      res.status(201).json({ success: true, data: share });
    } catch (error) {
      next(error);
    }
  }

  async getPublicTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.params['token'] || '';
      const data = await safetyService.getPublicTrackingData(token);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async renderPublicTrackingView(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.params['token'] || '';
      const data = await safetyService.getPublicTrackingData(token);
      const html = safetyService.renderTrackingHtml(data);
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================================================
  // Admin & Support SOS
  // ==========================================================================

  async listOpenSos(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await safetyService.listOpenSos();
      res.status(200).json({ success: true, data: list });
    } catch (error) {
      next(error);
    }
  }

  async acknowledgeSos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sosId = req.params['id'] || '';
      const input = req.body as AcknowledgeSosInput;
      const result = await safetyService.acknowledgeSos(req.user?.id || '', sosId, input?.notes);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async resolveSos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sosId = req.params['id'] || '';
      const input = req.body as ResolveSosInput;
      const result = await safetyService.resolveSos(req.user?.id || '', sosId, input.notes);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const safetyController = new SafetyController();
