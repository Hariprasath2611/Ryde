export interface PushNotification {
  recipientUserId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface SmsNotification {
  toPhoneNumber: string;
  templateId?: string;
  message: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface INotificationsService {
  sendPush(notification: PushNotification): Promise<NotificationResult>;
  sendSms(notification: SmsNotification): Promise<NotificationResult>;
}
