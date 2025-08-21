import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandler';
import { logger } from '../utils/logger';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : error.type,
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));

    logger.warn('Validation Error', {
      errors: validationErrors,
      request: {
        method: req.method,
        url: req.originalUrl || req.url,
        body: req.body,
        ip: req.ip,
      },
      timestamp: new Date().toISOString(),
    });

    const validationError = new ValidationError('Validation failed', validationErrors);
    next(validationError);
    return;
  }
  next();
};

// Legacy export
export const handleValidationErrors = validateRequest;

// Input sanitization helpers
export const sanitizeInput = (value: any): any => {
  if (typeof value === 'string') {
    return value.trim().replace(/[<>]/g, '');
  }
  return value;
};

export const createValidationChain = (validations: any[]) => {
  return [
    ...validations,
    handleValidationErrors
  ];
};

export const validateRegistration = createValidationChain([
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .customSanitizer(sanitizeInput),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters')
    .customSanitizer(sanitizeInput),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters')
    .customSanitizer(sanitizeInput),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a valid string')
    .customSanitizer(sanitizeInput),
]);

export const validateLogin = createValidationChain([
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .customSanitizer(sanitizeInput),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
]);

export const validateEmailVerification = createValidationChain([
  param('token')
    .isLength({ min: 1 })
    .withMessage('Verification token is required')
    .customSanitizer(sanitizeInput),
]);

export const validatePasswordReset = createValidationChain([
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .customSanitizer(sanitizeInput),
]);

export const validateNewPassword = createValidationChain([
  body('token')
    .isLength({ min: 1 })
    .withMessage('Reset token is required')
    .customSanitizer(sanitizeInput),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
]);

export const validateProfileUpdate = createValidationChain([
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters')
    .customSanitizer(sanitizeInput),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters')
    .customSanitizer(sanitizeInput),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a valid string')
    .customSanitizer(sanitizeInput),
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object'),
]);