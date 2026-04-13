import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: any[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): Response {
  return sendSuccess(res, data, message, 201);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): Response {
  const response: ApiResponse<T[]> = {
    success: true,
    message,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  return res.status(200).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: any[]
): Response {
  const response: ApiResponse = {
    success: false,
    error: message,
    errors,
  };
  return res.status(statusCode).json(response);
}

export function sendNotFound(
  res: Response,
  message: string = 'Resource not found'
): Response {
  return sendError(res, message, 404);
}

export function sendUnauthorized(
  res: Response,
  message: string = 'Unauthorized'
): Response {
  return sendError(res, message, 401);
}

export function sendForbidden(
  res: Response,
  message: string = 'Forbidden'
): Response {
  return sendError(res, message, 403);
}

export function sendServerError(
  res: Response,
  message: string = 'Internal server error'
): Response {
  return sendError(res, message, 500);
}

export function sendValidationError(
  res: Response,
  errors: any[]
): Response {
  return sendError(res, 'Validation failed', 422, errors);
}

// Alias functions for backward compatibility (used by Phase 4 controllers)
export function successResponse<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response {
  return sendSuccess(res, data, message, statusCode);
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode: number = 400
): Response {
  return sendError(res, message, statusCode);
}

