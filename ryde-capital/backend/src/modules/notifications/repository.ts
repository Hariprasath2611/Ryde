// ryde-capital/backend/src/modules/notifications/repository.ts
// Phase 5: Notifications & Device Tokens Repository

import { supabaseServiceClient } from '../../config/supabase.js';

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  notification_type: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface INotificationsRepository {
  getNotifications(
    userId: string,
    page: number,
    limit: number,
    unreadOnly?: boolean,
  ): Promise<{ notifications: NotificationRow[]; total: number; unreadCount: number }>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(userId: string, notificationId: string): Promise<boolean>;
  markAllAsRead(userId: string): Promise<number>;
  createNotification(
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: Record<string, unknown>,
  ): Promise<NotificationRow>;
  upsertDeviceToken(
    userId: string,
    deviceToken: string,
    platform: 'ios' | 'android' | 'web',
  ): Promise<void>;
  getDeviceTokensForUser(userId: string): Promise<string[]>;
  removeDeviceTokens(tokens: string[]): Promise<void>;
}

export class NotificationsRepository implements INotificationsRepository {
  async getNotifications(
    userId: string,
    page: number,
    limit: number,
    unreadOnly: boolean = false,
  ): Promise<{ notifications: NotificationRow[]; total: number; unreadCount: number }> {
    let query = supabaseServiceClient
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, count, error } = await query.range(from, to);

    if (error) {
      throw error;
    }

    const unreadCount = await this.getUnreadCount(userId);

    return {
      notifications: (data as NotificationRow[]) || [],
      total: count || 0,
      unreadCount,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabaseServiceClient
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      return 0;
    }
    return count || 0;
  }

  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const { error, count } = await supabaseServiceClient
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      throw error;
    }
    return (count || 0) > 0;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const { error, count } = await supabaseServiceClient
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      throw error;
    }
    return count || 0;
  }

  async createNotification(
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: Record<string, unknown>,
  ): Promise<NotificationRow> {
    const { data: created, error } = await supabaseServiceClient
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        body,
        notification_type: type,
        data: data || {},
      })
      .select()
      .single();

    if (error || !created) {
      throw error || new Error('Failed to create notification');
    }

    return created as NotificationRow;
  }

  async upsertDeviceToken(
    userId: string,
    deviceToken: string,
    platform: 'ios' | 'android' | 'web',
  ): Promise<void> {
    const { error } = await supabaseServiceClient
      .from('device_tokens')
      .upsert(
        {
          user_id: userId,
          device_token: deviceToken,
          platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,device_token' },
      );

    if (error) {
      throw error;
    }
  }

  async getDeviceTokensForUser(userId: string): Promise<string[]> {
    const { data, error } = await supabaseServiceClient
      .from('device_tokens')
      .select('device_token')
      .eq('user_id', userId);

    if (error || !data) {
      return [];
    }
    return data.map((d) => d.device_token);
  }

  async removeDeviceTokens(tokens: string[]): Promise<void> {
    if (!tokens || tokens.length === 0) return;
    const { error } = await supabaseServiceClient
      .from('device_tokens')
      .delete()
      .in('device_token', tokens);

    if (error) {
      console.warn('Failed to cleanup invalid device tokens:', error);
    }
  }
}

export const notificationsRepository = new NotificationsRepository();
