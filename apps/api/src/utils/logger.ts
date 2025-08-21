import winston from 'winston';
import { env } from '../config/environment';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors for console output
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(logColors);

// Create custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create transports array
const transports: winston.transport[] = [
  // Console transport for development
  new winston.transports.Console({
    format: env.NODE_ENV === 'development' ? consoleFormat : logFormat,
  }),
];

// Add file transports for production
if (env.NODE_ENV === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: logFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Create request-specific logger
export const requestLogger = (correlationId: string) => {
  return logger.child({ correlationId });
};

// Stream for morgan integration (if needed)
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Error logging helper
export const logError = (error: Error, context?: any) => {
  logger.error('Application Error', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    context,
    timestamp: new Date().toISOString(),
  });
};

// Performance logging helper
export const logPerformance = (operation: string, duration: number, metadata?: any) => {
  logger.info('Performance Metric', {
    operation,
    duration,
    metadata,
    timestamp: new Date().toISOString(),
  });
};

// Security event logging
export const logSecurityEvent = (event: string, details: any) => {
  logger.warn('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString(),
  });
};