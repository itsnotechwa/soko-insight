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
export declare function sendSuccess<T>(res: Response, data: T, message?: string, statusCode?: number): Response;
export declare function sendCreated<T>(res: Response, data: T, message?: string): Response;
export declare function sendPaginated<T>(res: Response, data: T[], page: number, limit: number, total: number, message?: string): Response;
export declare function sendError(res: Response, message: string, statusCode?: number, errors?: any[]): Response;
export declare function sendNotFound(res: Response, message?: string): Response;
export declare function sendUnauthorized(res: Response, message?: string): Response;
export declare function sendForbidden(res: Response, message?: string): Response;
export declare function sendServerError(res: Response, message?: string): Response;
export declare function sendValidationError(res: Response, errors: any[]): Response;
export declare function successResponse<T>(res: Response, data: T, message?: string, statusCode?: number): Response;
export declare function errorResponse(res: Response, message: string, statusCode?: number): Response;
//# sourceMappingURL=response.d.ts.map