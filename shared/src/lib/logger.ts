import pino, { type Logger, type LoggerOptions } from 'pino';

export interface CreateLoggerOptions extends LoggerOptions {
  serviceName?: string;
}

/**
 * Utility to redact sensitive strings such as Indian phone numbers, OTPs, and tokens
 * from arbitrary text or log strings.
 */
export function redactPii(text: string): string {
  if (!text) return text;
  return text
    // Redact Bearer JWT tokens: Bearer <chars>
    .replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, 'Bearer [REDACTED_TOKEN]')
    // Redact 10-digit Indian phone numbers with optional +91 prefix
    .replace(/(?:\+91[\s-]?)?[6-9]\d{9}/g, '[REDACTED_PHONE]')
    // Redact 4 to 6-digit standalone OTP codes preceded by OTP or otp:
    .replace(/(otp[:=\s]+)\d{4,6}/gi, '$1[REDACTED_OTP]');
}

export function createLogger(options?: CreateLoggerOptions): Logger {
  const isProduction = process.env['NODE_ENV'] === 'production';

  return pino({
    level: process.env['LOG_LEVEL'] || (isProduction ? 'info' : 'debug'),
    name: options?.serviceName || 'ryde-platform',
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'authorization',
        '*.authorization',
        'token',
        '*.token',
        'provider_token',
        '*.provider_token',
        'share_token',
        '*.share_token',
        'otp',
        '*.otp',
        'otp_code',
        '*.otp_code',
        'otp_hash',
        '*.otp_hash',
        'phone',
        '*.phone',
        'phoneNumber',
        '*.phoneNumber',
        'phone_number',
        '*.phone_number',
        'user.phone',
        'customer_phone',
        '*.customer_phone',
        'emergency_contact_phone',
        '*.emergency_contact_phone',
        'password',
        '*.password',
        'secret',
        '*.secret',
        'apiKey',
        '*.apiKey',
        'api_key',
        '*.api_key',
        'upi_id',
        '*.upi_id',
      ],
      censor: '[REDACTED]',
    },
    ...options,
  });
}

export const logger = createLogger();
