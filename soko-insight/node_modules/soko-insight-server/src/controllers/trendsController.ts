import { Request, Response } from 'express';
import { mlService } from '../services/mlService';
import { successResponse, errorResponse } from '../utils/response';

export class TrendsController {
  // Get Google Trends data
  static async getTrends(req: Request, res: Response): Promise<void> {
    try {
      const { keywords, geo = 'KE', timeframe = 'today 12-m' } = req.body;
      
      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        errorResponse(res, 'keywords array is required with at least one keyword', 400);
        return;
      }
      
      if (keywords.length > 5) {
        errorResponse(res, 'Maximum 5 keywords allowed', 400);
        return;
      }
      
      const trends = await mlService.getTrends({
        keywords,
        geo: geo as string,
        timeframe: timeframe as string,
      });
      
      successResponse(res, trends, 'Trends retrieved successfully');
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }
}

