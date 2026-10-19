import pino, { type Logger, type LoggerOptions } from 'pino';

export interface CreateLoggerOptions extends LoggerOptions {
  serviceName?: string;
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
      paths: ['req.headers.authorization', '*.password', '*.token', '*.otp', 'user.phone'],
      remove: true,
    },
    ...options,
  });
}

export const logger = createLogger();
