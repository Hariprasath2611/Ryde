// ryde-capital/backend/src/modules/notifications/schema.ts
// Phase 5: Zod Schemas for Notifications & Device Token Registration

import { z } from 'zod';

export const registerDeviceTokenSchema = z.object({
  token: z.string().min(5, 'Device token cannot be empty'),
  platform: z.enum(['ios', 'android', 'web']).default('android'),
});

export const notificationIdParamSchema = z.object({
  id: z.string().uuid('Invalid notification ID format'),
});

export const getNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unreadOnly: z.coerce.boolean().optional().default(false),
});

export type RegisterDeviceTokenInput = z.infer<typeof registerDeviceTokenSchema>;
export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;
export type GetNotificationsQueryInput = z.infer<typeof getNotificationsQuerySchema>;
