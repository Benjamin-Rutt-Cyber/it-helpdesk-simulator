import { Request, Response, NextFunction } from 'express';
import { logger, logError, logSecurityEvent } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

// Custom error classes
export class AppError extends Error implements ApiError {
  statusCode: number;
  code: string;
  isOperational: boolean;
  details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'APP_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line no-unused-vars
  next: NextFunction
): void {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';
  let details = err.details;

  // Handle specific authentication errors (backward compatibility)
  if (message.includes('User already exists')) {
    statusCode = 409;
    code = 'USER_EXISTS';
  } else if (message.includes('Invalid email or password')) {
    statusCode = 401;
    code = 'INVALID_CREDENTIALS';
  } else if (message.includes('Please verify your email')) {
    statusCode = 401;
    code = 'EMAIL_NOT_VERIFIED';
  } else if (message.includes('Invalid or expired')) {
    statusCode = 400;
    code = 'INVALID_TOKEN';
  } else if (message.includes('User not found')) {
    statusCode = 404;
    code = 'USER_NOT_FOUND';
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    code = 'DATABASE_ERROR';
    message = 'Database operation failed';
  }

  // Handle validation errors from express-validator
  if (err.name === 'ValidationError' && Array.isArray(err.details)) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    details = err.details;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Log error with appropriate level
  const errorLog = {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code,
      statusCode,
    },
    request: {
      method: req.method,
      url: req.originalUrl || req.url,
      headers: req.headers,
      body: req.body,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
    timestamp: new Date().toISOString(),
  };

  if (statusCode >= 500) {
    logError(err, errorLog);
  } else if (statusCode >= 400) {
    logger.warn('Client Error', errorLog);
  }

  // Log security events
  if (statusCode === 401 || statusCode === 403) {
    logSecurityEvent('UNAUTHORIZED_ACCESS', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl || req.url,
      method: req.method,
    });
  }

  // Don't expose sensitive information in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  const errorResponse = {
    success: false,
    error: {
      message,
      code,
      ...(details && { details }),
      ...(isDevelopment && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(errorResponse);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp: new Date().toISOString(),
  });
}