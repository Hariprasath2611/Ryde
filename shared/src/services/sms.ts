// shared/src/services/sms.ts
// Phase 5 & 6: SMS Provider Interface with Circuit Breaker and Validation for Emergency Alerts

import { CircuitBreaker } from '../lib/circuitBreaker.js';

export interface SendSmsInput {
  to: string;
  message: string;
}

export interface SendSmsResult {
  messageId: string;
  status: 'sent' | 'failed';
  dispatchedAt: string;
  error?: string;
}

export interface ISmsProvider {
  sendSms(input: SendSmsInput): Promise<SendSmsResult>;
  getCircuitBreaker?(): CircuitBreaker;
}

/**
 * Validates Indian E.164 phone numbers (+91 followed by 10 digits starting with 6-9)
 */
export function isValidIndianPhone(phone: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(phone.trim());
}

export class MockSmsProvider implements ISmsProvider {
  private dispatches: Array<{ to: string; message: string; timestamp: string }> = [];
  public readonly circuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker({
      name: 'SMSProviderBreaker',
      failureThreshold: 3,
      resetTimeoutMs: 15000,
    });
  }

  getCircuitBreaker(): CircuitBreaker {
    return this.circuitBreaker;
  }

  async sendSms(input: SendSmsInput): Promise<SendSmsResult> {
    return this.circuitBreaker.execute(
      async () => {
        const cleaned = input.to.trim();
        if (!isValidIndianPhone(cleaned)) {
          return {
            messageId: '',
            status: 'failed',
            dispatchedAt: new Date().toISOString(),
            error: `Invalid Indian phone number: '${cleaned}'. Expected format: +91XXXXXXXXXX`,
          };
        }

        const messageId = `sms_mock_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const record = {
          to: cleaned,
          message: input.message,
          timestamp: new Date().toISOString(),
        };
        this.dispatches.push(record);

        return {
          messageId,
          status: 'sent',
          dispatchedAt: record.timestamp,
        };
      },
      () => ({
        messageId: '',
        status: 'failed',
        dispatchedAt: new Date().toISOString(),
        error: 'SMS provider circuit breaker is OPEN. Fast-failing SMS dispatch.',
      }),
    );
  }

  getDispatches(): Array<{ to: string; message: string; timestamp: string }> {
    return [...this.dispatches];
  }

  clearDispatches(): void {
    this.dispatches = [];
  }
}

export const mockSmsProvider = new MockSmsProvider();
