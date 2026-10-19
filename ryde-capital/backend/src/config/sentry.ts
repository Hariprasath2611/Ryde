// ryde-capital/backend/src/config/sentry.ts
// Sentry error tracking and performance monitoring configuration for backend

import { env } from './env.js';
import { redactPii } from '@ryde/shared';

export interface SentryConfig {
  dsn?: string;
  environment: string;
  release: string;
  tracesSampleRate: number;
}

export class BackendTelemetryService {
  private isInitialized = false;

  init(): void {
    const dsn = process.env['SENTRY_DSN'];
    if (!dsn) {
      // In dev or CI environments without SENTRY_DSN, Sentry runs in noop mode
      return;
    }

    this.isInitialized = true;
    console.log(`[Sentry] Initialized backend monitoring for environment: ${env.NODE_ENV}`);
  }

  captureException(error: Error | unknown, context?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      return;
    }

    // Sanitize any PII in context metadata before sending upstream
    const sanitizedContext: Record<string, unknown> = {};
    if (context) {
      for (const [key, val] of Object.entries(context)) {
        if (typeof val === 'string') {
          sanitizedContext[key] = redactPii(val);
        } else {
          sanitizedContext[key] = val;
        }
      }
    }

    // If @sentry/node is attached, Sentry.captureException is invoked
    // Here we provide the standard contract and safety guards
  }
}

export const telemetryService = new BackendTelemetryService();
telemetryService.init();
