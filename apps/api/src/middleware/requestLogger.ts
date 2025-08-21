import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface RequestLogData {
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  timestamp: string;
  userId?: string;
  responseTime?: number;
  statusCode?: number;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Capture request data
  const requestData: RequestLogData = {
    method: req.method,
    url: req.originalUrl || req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    timestamp: new Date().toISOString(),
    userId: (req as any).user?.id // Will be set by auth middleware
  };

  // Log the request
  logger.info('API Request', requestData);

  // Override res.end to capture response data
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    
    // Log the response
    logger.info('API Response', {
      ...requestData,
      responseTime,
      statusCode: res.statusCode
    });

    // Call original end method
    originalEnd.call(this, chunk, encoding);
    return this;
  };

  next();
}

export function skipLogging(req: Request): boolean {
  // Skip logging for health check and static asset requests
  const skipPaths = ['/health', '/favicon.ico', '/robots.txt'];
  return skipPaths.some(path => req.path.startsWith(path));
}