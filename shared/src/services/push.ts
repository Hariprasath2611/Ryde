// shared/src/services/push.ts
// Phase 5: Push Notification Service via Expo Push Service with standard templates and invalid token detection

export interface ExpoPushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
  badge?: number;
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: 'DeviceNotRegistered' | 'InvalidCredentials' | 'MessageTooBig' | 'MessageRateExceeded';
  };
}

export interface PushDispatchResult {
  successfulTokens: string[];
  invalidTokens: string[]; // Tokens that returned DeviceNotRegistered and should be deleted
  failedTokens: string[];
}

export function isExpoPushToken(token: string): boolean {
  return /^(ExponentPushToken|ExpoPushToken)\[.*\]$/.test(token.trim());
}

export type PushTemplateType = 'new_offer' | 'trip_event' | 'driver_approval' | 'settlement';

export interface PushTemplatePayload {
  new_offer: { assignmentId: string; pickupAddress: string; estimatedFare: number };
  trip_event: { tripId: string; event: string; message: string };
  driver_approval: { status: 'approved' | 'rejected'; reason?: string };
  settlement: { amount: number; period: string };
}

export function buildPushMessage<T extends PushTemplateType>(
  template: T,
  recipientToken: string | string[],
  payload: PushTemplatePayload[T],
): ExpoPushMessage {
  switch (template) {
    case 'new_offer': {
      const p = payload as PushTemplatePayload['new_offer'];
      return {
        to: recipientToken,
        title: '🚖 New Ride Offer Available',
        body: `Pickup: ${p.pickupAddress} • Fare: ₹${p.estimatedFare}. Tap to view.`,
        sound: 'default',
        priority: 'high',
        channelId: 'offers',
        data: {
          type: 'OFFER',
          assignmentId: p.assignmentId,
        },
      };
    }
    case 'trip_event': {
      const p = payload as PushTemplatePayload['trip_event'];
      return {
        to: recipientToken,
        title: `Trip Notification (${p.event})`,
        body: p.message,
        sound: 'default',
        priority: 'high',
        channelId: 'trips',
        data: {
          type: 'TRIP',
          tripId: p.tripId,
        },
      };
    }
    case 'driver_approval': {
      const p = payload as PushTemplatePayload['driver_approval'];
      const isApproved = p.status === 'approved';
      return {
        to: recipientToken,
        title: isApproved ? '🎉 Profile Approved!' : '⚠️ Profile Update Required',
        body: isApproved
          ? 'You are now approved to go online and accept ride bookings.'
          : `Review notice: ${p.reason || 'Please check your submitted documents.'}`,
        sound: 'default',
        priority: 'high',
        data: {
          type: 'PROFILE',
          status: p.status,
        },
      };
    }
    case 'settlement': {
      const p = payload as PushTemplatePayload['settlement'];
      return {
        to: recipientToken,
        title: '💰 Weekly Payout Settled',
        body: `₹${p.amount.toFixed(2)} has been transferred to your default payout account for ${p.period}.`,
        sound: 'default',
        priority: 'normal',
        data: {
          type: 'EARNINGS',
        },
      };
    }
    default:
      throw new Error(`Unknown push template: ${template}`);
  }
}

export class PushNotificationService {
  private expoApiUrl = 'https://exp.host/--/api/v2/push/send';
  private sentMessages: ExpoPushMessage[] = [];

  constructor(private isDevOrTest: boolean = process.env.NODE_ENV === 'test' || !process.env.EXPO_ACCESS_TOKEN) {}

  async sendPush(messages: ExpoPushMessage[]): Promise<PushDispatchResult> {
    const result: PushDispatchResult = {
      successfulTokens: [],
      invalidTokens: [],
      failedTokens: [],
    };

    if (messages.length === 0) return result;

    // Filter and collect tokens
    for (const msg of messages) {
      const tokens = Array.isArray(msg.to) ? msg.to : [msg.to];
      for (const token of tokens) {
        if (!isExpoPushToken(token)) {
          // Dev mock or standard test token
          if (token.startsWith('mock_token_') || token.startsWith('ExponentPushToken[')) {
            result.successfulTokens.push(token);
          } else {
            result.invalidTokens.push(token);
          }
        }
      }
    }

    // In dev / test mode, record messages and return mocked success
    if (this.isDevOrTest) {
      this.sentMessages.push(...messages);
      for (const msg of messages) {
        const tokens = Array.isArray(msg.to) ? msg.to : [msg.to];
        for (const token of tokens) {
          if (!result.invalidTokens.includes(token)) {
            result.successfulTokens.push(token);
          }
        }
      }
      return result;
    }

    try {
      const response = await fetch(this.expoApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        // Fallback: mark tokens failed
        for (const msg of messages) {
          const tokens = Array.isArray(msg.to) ? msg.to : [msg.to];
          result.failedTokens.push(...tokens);
        }
        return result;
      }

      const body = (await response.json()) as { data?: ExpoPushTicket[] };
      const tickets = body.data || [];

      tickets.forEach((ticket, idx) => {
        const msg = messages[idx];
        const token = msg ? (Array.isArray(msg.to) ? msg.to[0] : msg.to) : '';
        if (!token) return;

        if (ticket.status === 'ok') {
          result.successfulTokens.push(token);
        } else if (ticket.details?.error === 'DeviceNotRegistered') {
          result.invalidTokens.push(token);
        } else {
          result.failedTokens.push(token);
        }
      });
    } catch (_e) {
      // Network failure
      for (const msg of messages) {
        const tokens = Array.isArray(msg.to) ? msg.to : [msg.to];
        result.failedTokens.push(...tokens);
      }
    }

    return result;
  }

  getSentMessages(): ExpoPushMessage[] {
    return [...this.sentMessages];
  }

  clearSentMessages(): void {
    this.sentMessages = [];
  }
}

export const pushService = new PushNotificationService();
