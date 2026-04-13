import { Request, Response } from 'express';
import { RecommendationsService } from '../services/recommendationsService';
import { sendSuccess, sendError } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';

// Get recommendations for user
export const getRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const recommendations = await RecommendationsService.generateRecommendations(req.user!.id);
  
  return sendSuccess(res, recommendations);
});

// Generate and save recommendations (creates notifications)
export const generateRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const recommendations = await RecommendationsService.generateAndSaveRecommendations(req.user!.id);
  
  // Ensure recommendations is an array
  const recommendationsData = Array.isArray(recommendations) ? recommendations : [];
  
  return sendSuccess(res, recommendationsData, 'Recommendations generated and saved');
});






