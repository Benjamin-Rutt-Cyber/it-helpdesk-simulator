import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { userRepository } from '../repositories/userRepository';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    level: number;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
      return;
    }

    // Validate JWT token
    const decoded = await authService.validateToken(token);

    // Get user from database to ensure they still exist
    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found.'
      });
      return;
    }

    if (!user.isVerified) {
      res.status(401).json({
        success: false,
        error: 'Account not verified. Please verify your email.'
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      level: user.level
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token.'
    });
  }
};

// Legacy export
export const authMiddleware = authenticateToken;

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      next();
      return;
    }

    // Validate JWT token
    const decoded = await authService.validateToken(token);

    // Get user from database
    const user = await userRepository.findById(decoded.userId);
    if (user && user.isVerified) {
      req.user = {
        id: user.id,
        email: user.email,
        level: user.level
      };
    }

    next();
  } catch (error) {
    // For optional auth, continue without user context if token is invalid
    next();
  }
};