import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendError, sendValidationError, sendServerError } from '../utils/response';
import { config } from '../config';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation middleware (to be used after express-validator checks)
export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: 'path' in err ? err.path : 'unknown',
      message: err.msg,
    }));
    
    sendValidationError(res, formattedErrors);
    return;
  }
  
  next();
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route ${req.originalUrl} not found`, 404);
}

// Global error handler
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);
  
  // Handle known operational errors
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', 401);
    return;
  }
  
  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', 401);
    return;
  }
  
  // Handle PostgreSQL errors
  if ('code' in err) {
    const pgError = err as any;
    
    // Unique violation
    if (pgError.code === '23505') {
      const match = pgError.detail?.match(/Key \((.+)\)=/);
      const field = match ? match[1] : 'field';
      sendError(res, `A record with this ${field} already exists`, 409);
      return;
    }
    
    // Foreign key violation
    if (pgError.code === '23503') {
      sendError(res, 'Referenced record does not exist', 400);
      return;
    }
    
    // Check constraint violation
    if (pgError.code === '23514') {
      sendError(res, 'Invalid value provided', 400);
      return;
    }
  }
  
  // Handle multer errors
  if (err.name === 'MulterError') {
    const multerError = err as any;
    if (multerError.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'File too large', 413);
      return;
    }
    sendError(res, `File upload error: ${multerError.message}`, 400);
    return;
  }
  
  // Default to 500 server error
  if (config.nodeEnv === 'development') {
    sendError(res, err.message || 'Internal server error', 500);
  } else {
    sendServerError(res);
  }
}

// Async handler wrapper to catch async errors
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

