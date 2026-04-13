import { Request, Response } from 'express';
import { ProductModel } from '../models/Product';
import { sendSuccess, sendCreated, sendError, sendPaginated, sendNotFound } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';

// Get all products for current user
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, categoryId, isActive, sortBy, sortOrder } = req.query;
  
  const result = await ProductModel.findByUserId(req.user!.id, {
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 20,
    search: search as string,
    categoryId: categoryId as string,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  });
  
  return sendPaginated(
    res,
    result.products,
    page ? parseInt(page as string, 10) : 1,
    limit ? parseInt(limit as string, 10) : 20,
    result.total
  );
});

// Get single product
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await ProductModel.findById(req.params.id, req.user!.id);
  
  if (!product) {
    return sendNotFound(res, 'Product not found');
  }
  
  return sendSuccess(res, product);
});

// Create product
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, sku, description, categoryId, costPrice, sellingPrice, currentStock, reorderLevel, unit } = req.body;
  
  const product = await ProductModel.create({
    userId: req.user!.id,
    name,
    sku,
    description,
    categoryId,
    costPrice,
    sellingPrice,
    currentStock,
    reorderLevel,
    unit,
  });
  
  return sendCreated(res, product, 'Product created successfully');
});

// Update product
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, sku, description, categoryId, costPrice, sellingPrice, currentStock, reorderLevel, unit, isActive } = req.body;
  
  const product = await ProductModel.update(req.params.id, req.user!.id, {
    name,
    sku,
    description,
    categoryId,
    costPrice,
    sellingPrice,
    currentStock,
    reorderLevel,
    unit,
    isActive,
  });
  
  if (!product) {
    return sendNotFound(res, 'Product not found');
  }
  
  return sendSuccess(res, product, 'Product updated successfully');
});

// Delete product
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await ProductModel.delete(req.params.id, req.user!.id);
  
  if (!deleted) {
    return sendNotFound(res, 'Product not found');
  }
  
  return sendSuccess(res, null, 'Product deleted successfully');
});

// Get low stock products
export const getLowStockProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await ProductModel.getLowStock(req.user!.id);
  
  return sendSuccess(res, products);
});

// Update stock
export const updateStock = asyncHandler(async (req: Request, res: Response) => {
  const { quantity, operation } = req.body;
  
  if (!['add', 'subtract', 'set'].includes(operation)) {
    return sendError(res, 'Operation must be one of: add, subtract, set', 400);
  }
  
  const product = await ProductModel.updateStock(req.params.id, quantity, operation);
  
  if (!product) {
    return sendNotFound(res, 'Product not found');
  }
  
  return sendSuccess(res, product, 'Stock updated successfully');
});

