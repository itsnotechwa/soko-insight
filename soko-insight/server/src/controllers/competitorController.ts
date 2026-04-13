import { Request, Response } from 'express';
import { CompetitorModel, CompetitorPriceModel } from '../models/Competitor';
import { ProductModel } from '../models/Product';
import { successResponse, errorResponse } from '../utils/response';

export class CompetitorController {
  // Get all competitors
  static async getCompetitors(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { page = 1, limit = 20, search, platform, isActive } = req.query;
      
      const result = await CompetitorModel.findByUserId(userId, {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        search: search as string,
        platform: platform as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });
      
      successResponse(res, result, 'Competitors retrieved successfully');
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }
  
  // Get single competitor
  static async getCompetitor(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      
      const competitor = await CompetitorModel.findById(id, userId);
      
      if (!competitor) {
        errorResponse(res, 'Competitor not found', 404);
        return;
      }
      
      successResponse(res, competitor, 'Competitor retrieved successfully');
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }
  
  // Create competitor
  static async createCompetitor(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { name, platform, website, notes } = req.body;
      
      if (!name) {
        errorResponse(res, 'Competitor name is required', 400);
        return;
      }
      
      const competitor = await CompetitorModel.create({
        userId,
        name,
        platform,
        website,
        notes,
      });
      
      successResponse(res, competitor, 'Competitor created successfully', 201);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }
  
  // Update competitor
  static async updateCompetitor(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { name, platform, website, notes, isActive } = req.body;
      
      const competitor = await CompetitorModel.update(id, userId, {
        name,
        platform,
        website,
        notes,
        isActive,
      });
      
      if (!competitor) {
        errorResponse(res, 'Competitor not found', 404);
        return;
      }
      
      successResponse(res, competitor, 'Competitor updated successfully');
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }
  
  // Delete competitor
  static async deleteCompetitor(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      
      const deleted = await CompetitorModel.delete(id, userId);
      
      if (!deleted) {
        errorResponse(res, 'Competitor not found', 404);
        return;
      }
      
      successResponse(res, null, 'Competitor deleted successfully');
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }
  
  // Add competitor price
  static async addPrice(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { productId, competitorId, price } = req.body;
      
      if (!productId || !competitorId || price === undefined) {
        errorResponse(res, 'Product ID, competitor ID, and price are required', 400);
        return;
      }
      
      // Verify product belongs to user
      const product = await ProductModel.findById(productId, userId);
      if (!product) {
        errorResponse(res, 'Product not found', 404);
        return;
      }
      
      // Verify competitor belongs to user
      const competitor = await CompetitorModel.findById(competitorId, userId);
      if (!competitor) {
        errorResponse(res, 'Competitor not found', 404);
        return;
      }
      
      const priceRecord = await CompetitorPriceModel.create({
        productId,
        competitorId,
        price: parseFloat(price),
      });
      
      successResponse(res, priceRecord, 'Price recorded successfully', 201);
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }
  
  // Get price comparison for a product
  static async getPriceComparison(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { productId } = req.params;
      
      // Verify product belongs to user
      const product = await ProductModel.findById(productId, userId);
      if (!product) {
        errorResponse(res, 'Product not found', 404);
        return;
      }
      
      const comparison = await CompetitorPriceModel.getPriceComparison(
        productId,
        product.sellingPrice
      );
      
      successResponse(res, comparison, 'Price comparison retrieved successfully');
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }
  
  // Get price history
  static async getPriceHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { productId, competitorId } = req.params;
      const { days = 30 } = req.query;
      
      // Verify product belongs to user
      const product = await ProductModel.findById(productId, userId);
      if (!product) {
        errorResponse(res, 'Product not found', 404);
        return;
      }
      
      // Verify competitor belongs to user
      const competitor = await CompetitorModel.findById(competitorId, userId);
      if (!competitor) {
        errorResponse(res, 'Competitor not found', 404);
        return;
      }
      
      const history = await CompetitorPriceModel.getPriceHistory(
        productId,
        competitorId,
        parseInt(days as string, 10)
      );
      
      successResponse(res, history, 'Price history retrieved successfully');
    } catch (error: any) {
      errorResponse(res, error.message, 500);
    }
  }
}

