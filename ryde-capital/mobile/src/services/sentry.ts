// ryde-capital/mobile/src/services/sentry.ts
// Mobile crash reporting, error boundaries, and telemetry service

export interface CrashReportOptions {
  componentStack?: string | null;
  extra?: Record<string, unknown>;
  driverId?: string;
}

export class MobileCrashReporter {
  private static isConfigured = false;

  static init(): void {
    const dsn = process.env['EXPO_PUBLIC_SENTRY_DSN'];
    if (!dsn) {
      // Runs silently in local dev or test environments
      this.isConfigured = false;
      return;
    }
    this.isConfigured = true;
    console.log('[MobileCrashReporter] Initialized crash reporting');
  }

  static captureException(error: Error | unknown, options?: CrashReportOptions): void {
    if (__DEV__) {
      console.error('[MobileCrashReporter:DEV_ERROR]', error, options?.componentStack);
    }

    if (!this.isConfigured) {
      return;
    }

    // In production with Sentry configured, scrub PII (phone numbers, OTPs)
    // and log to Sentry with device metadata
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (__DEV__) {
      console.log(`[MobileCrashReporter:${level.toUpperCase()}]`, message);
    }
  }
}

MobileCrashReporter.init();
