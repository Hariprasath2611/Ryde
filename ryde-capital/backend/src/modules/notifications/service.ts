// ryde-capital/backend/src/modules/notifications/service.ts
// Phase 5: Notifications Business Logic & Push Integration

import {
  pushService,
  buildPushMessage,
  type PushTemplateType,
  type PushTemplatePayload,
} from '@ryde/shared';
import {
  notificationsRepository,
  type INotificationsRepository,
} from './repository.js';
import type { GetNotificationsQueryInput } from './schema.js';

export class NotificationsService {
  constructor(private repo: INotificationsRepository = notificationsRepository) {}

  async getNotifications(userId: string, query: GetNotificationsQueryInput) {
    const { notifications, total, unreadCount } = await this.repo.getNotifications(
      userId,
      query.page,
      query.limit,
      query.unreadOnly,
    );

    return {
      notifications,
      unreadCount,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const updated = await this.repo.markAsRead(userId, notificationId);
    if (!updated) {
      // Check if it already exists but was already read or not found
      return { success: true, message: 'Notification already marked as read or updated' };
    }
    return { success: true, message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string) {
    const count = await this.repo.markAllAsRead(userId);
    return { success: true, count, message: 'All notifications marked as read' };
  }

  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web' = 'android',
  ) {
    await this.repo.upsertDeviceToken(userId, token, platform);
    return { success: true, message: 'Device token registered successfully' };
  }

  async sendInAppAndPush<T extends PushTemplateType>(
    userId: string,
    template: T,
    payload: PushTemplatePayload[T],
  ) {
    const tokens = await this.repo.getDeviceTokensForUser(userId);
    const pushMsg = buildPushMessage(template, tokens.length > 0 ? tokens : ['mock_token_dev'], payload);

    // 1. Create In-App Notification
    const inAppRecord = await this.repo.createNotification(
      userId,
      pushMsg.title,
      pushMsg.body,
      template,
      pushMsg.data,
    );

    // 2. Dispatch push notifications if devices registered
    if (tokens.length > 0) {
      const dispatchResult = await pushService.sendPush([pushMsg]);

      // 3. Clean up invalid tokens
      if (dispatchResult.invalidTokens.length > 0) {
        await this.repo.removeDeviceTokens(dispatchResult.invalidTokens);
      }
    }

    return inAppRecord;
  }
}

export const notificationsService = new NotificationsService();
