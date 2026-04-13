import { Request, Response } from 'express';
import { SalesDataModel, CreateSalesDataInput } from '../models/SalesData';
import { ProductModel } from '../models/Product';
import { sendSuccess, sendCreated, sendError, sendPaginated, sendNotFound } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { FileProcessor, ColumnMapping } from '../services/fileProcessor';
import { MpesaParser } from '../services/mpesaParser';
import path from 'path';

// Get sales data with filters
export const getSales = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, startDate, endDate, productId, channelId, sortBy, sortOrder } = req.query;
  
  const result = await SalesDataModel.findByUserId(req.user!.id, {
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 50,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    productId: productId as string,
    channelId: channelId as string,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
  });
  
  return sendPaginated(
    res,
    result.sales,
    page ? parseInt(page as string, 10) : 1,
    limit ? parseInt(limit as string, 10) : 50,
    result.total
  );
});

// Quick entry - create single sale
export const quickEntry = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity, unitPrice, saleDate, channelId, notes } = req.body;
  
  // Get product to calculate cost
  let costAmount = 0;
  if (productId) {
    const product = await ProductModel.findById(productId, req.user!.id);
    if (!product) {
      return sendNotFound(res, 'Product not found');
    }
    costAmount = product.costPrice * quantity;
    
    // Update product stock
    await ProductModel.updateStock(productId, quantity, 'subtract');
  }
  
  const sale = await SalesDataModel.create({
    userId: req.user!.id,
    productId,
    channelId,
    saleDate: saleDate ? new Date(saleDate) : new Date(),
    quantity,
    unitPrice,
    costAmount,
    entryMethod: 'quick_entry',
    notes,
  });
  
  return sendCreated(res, sale, 'Sale recorded successfully');
});

// Bulk create sales (manual entry)
export const bulkCreate = asyncHandler(async (req: Request, res: Response) => {
  const { sales } = req.body;
  
  if (!Array.isArray(sales) || sales.length === 0) {
    return sendError(res, 'Sales array is required', 400);
  }
  
  const records = sales.map((sale: any) => ({
    userId: req.user!.id,
    productId: sale.productId,
    channelId: sale.channelId,
    saleDate: new Date(sale.saleDate),
    quantity: sale.quantity,
    unitPrice: sale.unitPrice,
    costAmount: sale.costAmount,
    entryMethod: 'manual' as const,
    notes: sale.notes,
  }));
  
  const result = await SalesDataModel.bulkCreate(records);
  
  return sendCreated(res, result, `Created ${result.created} sales records`);
});

// Delete sale
export const deleteSale = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await SalesDataModel.delete(req.params.id, req.user!.id);
  
  if (!deleted) {
    return sendNotFound(res, 'Sale not found');
  }
  
  return sendSuccess(res, null, 'Sale deleted successfully');
});

// Get sales summary
export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  const summary = await SalesDataModel.getSummary(
    req.user!.id,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );
  
  return sendSuccess(res, summary);
});

// Get daily sales for charts
export const getDailySales = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return sendError(res, 'startDate and endDate are required', 400);
  }
  
  const dailySales = await SalesDataModel.getDailySales(
    req.user!.id,
    new Date(startDate as string),
    new Date(endDate as string)
  );
  
  return sendSuccess(res, dailySales);
});

// Get top products
export const getTopProducts = asyncHandler(async (req: Request, res: Response) => {
  const { limit, startDate, endDate } = req.query;
  
  const topProducts = await SalesDataModel.getTopProducts(
    req.user!.id,
    limit ? parseInt(limit as string, 10) : 10,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );
  
  return sendSuccess(res, topProducts);
});

// Get sales by channel
export const getSalesByChannel = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  const salesByChannel = await SalesDataModel.getSalesByChannel(
    req.user!.id,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );
  
  return sendSuccess(res, salesByChannel);
});

// Detect file headers for column mapping
export const detectHeaders = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  
  if (!file) {
    return sendError(res, 'No file uploaded', 400);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const fileType = ext === '.csv' ? 'csv' : 'xlsx';
  
  const headers = FileProcessor.detectHeaders(file.buffer, fileType);
  
  return sendSuccess(res, { headers, fileType });
});

// Upload CSV/Excel file
export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  const {
    channelId,
    defaultChannelId,
    skipFirstRow,
    dateFormat,
    columnMapping: columnMappingStr,
  } = req.body;

  if (!file) {
    return sendError(res, 'No file uploaded', 400);
  }

  if (!columnMappingStr) {
    return sendError(res, 'Column mapping is required', 400);
  }

  let columnMapping: ColumnMapping;
  try {
    columnMapping = JSON.parse(columnMappingStr);
  } catch (error) {
    return sendError(res, 'Invalid column mapping format', 400);
  }

  // Validate required mappings
  if (!columnMapping.saleDate || (!columnMapping.quantity || (!columnMapping.unitPrice && !columnMapping.totalAmount))) {
    return sendError(res, 'Missing required column mappings: saleDate, quantity, and (unitPrice or totalAmount)', 400);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  let processedRows;

  try {
    if (ext === '.csv') {
      processedRows = await FileProcessor.processCSV(file.buffer, {
        userId: req.user!.id,
        channelId,
        defaultChannelId,
        columnMapping,
        skipFirstRow: skipFirstRow === 'true',
        dateFormat,
      });
    } else if (ext === '.xlsx' || ext === '.xls') {
      processedRows = await FileProcessor.processExcel(file.buffer, {
        userId: req.user!.id,
        channelId,
        defaultChannelId,
        columnMapping,
        skipFirstRow: skipFirstRow === 'true',
        dateFormat,
      });
    } else {
      return sendError(res, 'Unsupported file type. Only CSV and Excel files are supported.', 400);
    }

    // Separate valid and invalid rows
    const validRows: CreateSalesDataInput[] = [];
    const invalidRows: { row: number; errors: string[] }[] = [];

    processedRows.forEach((processed) => {
      if (processed.data && processed.errors.length === 0) {
        validRows.push(processed.data);
      } else {
        invalidRows.push({
          row: processed.row,
          errors: processed.errors,
        });
      }
    });

    // Bulk create valid sales records
    let created = 0;
    let failed = 0;

    if (validRows.length > 0) {
      // Calculate cost amounts for products
      const productIds = new Set(validRows.filter(r => r.productId).map(r => r.productId!));
      const products = await Promise.all(
        Array.from(productIds).map(id => ProductModel.findById(id, req.user!.id))
      );

      const productMap = new Map<string, number>();
      products.forEach(p => {
        if (p) productMap.set(p.id, p.costPrice);
      });

      // Add cost amounts and update stock
      for (const record of validRows) {
        try {
          if (record.productId) {
            const costPrice = productMap.get(record.productId) || 0;
            record.costAmount = costPrice * record.quantity;

            // Update product stock
            await ProductModel.updateStock(record.productId, record.quantity, 'subtract');
          }

          await SalesDataModel.create(record);
          created++;
        } catch (error) {
          console.error('Failed to create sales record:', error);
          failed++;
        }
      }
    }

    return sendSuccess(res, {
      total: processedRows.length,
      created,
      failed,
      invalid: invalidRows.length,
      invalidRows: invalidRows.slice(0, 50), // Limit to first 50 invalid rows
      summary: {
        successRate: processedRows.length > 0 ? ((created / processedRows.length) * 100).toFixed(2) + '%' : '0%',
      },
    }, `Processed ${processedRows.length} rows. Created ${created} sales records.`);
  } catch (error) {
    console.error('File processing error:', error);
    return sendError(res, error instanceof Error ? error.message : 'Failed to process file', 500);
  }
});

// Upload M-Pesa statement
export const uploadMpesa = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  const { channelId, minAmount, excludeWithdrawals } = req.body;

  if (!file) {
    return sendError(res, 'No file uploaded', 400);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.csv') {
    return sendError(res, 'M-Pesa statements must be in CSV format. Please export from M-Pesa portal as CSV.', 400);
  }

  try {
    const parsedTransactions = await MpesaParser.parseCSV(file.buffer, {
      userId: req.user!.id,
      channelId,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      excludeWithdrawals: excludeWithdrawals === 'true',
    });

    // Separate valid and invalid transactions
    const validTransactions = parsedTransactions.filter(
      (t) => t.salesData && t.errors.length === 0
    );
    const invalidTransactions = parsedTransactions.filter(
      (t) => !t.salesData || t.errors.length > 0
    );

    // Get products to match transactions
    const productsResult = await ProductModel.findByUserId(req.user!.id, { limit: 1000 });
    const productPriceMap = new Map<number, string>();
    productsResult.products.forEach((p) => {
      const price = Math.round(p.sellingPrice * 100) / 100; // Round to 2 decimals
      productPriceMap.set(price, p.id);
    });

    // Match transactions to products
    const matchedTransactions = await MpesaParser.matchToProducts(
      validTransactions,
      productPriceMap
    );

    // Bulk create sales records
    let created = 0;
    let failed = 0;

    for (const parsed of matchedTransactions) {
      if (!parsed.salesData) continue;

      try {
        // Calculate cost if product is matched
        if (parsed.salesData.productId) {
          const product = await ProductModel.findById(parsed.salesData.productId, req.user!.id);
          if (product) {
            parsed.salesData.costAmount = product.costPrice * parsed.salesData.quantity;
            // Update product stock
            await ProductModel.updateStock(parsed.salesData.productId, parsed.salesData.quantity, 'subtract');
          }
        }

        await SalesDataModel.create(parsed.salesData);
        created++;
      } catch (error) {
        console.error('Failed to create sales record from M-Pesa transaction:', error);
        failed++;
      }
    }

    return sendSuccess(
      res,
      {
        total: parsedTransactions.length,
        created,
        failed,
        invalid: invalidTransactions.length,
        invalidTransactions: invalidTransactions.slice(0, 50).map((t) => ({
          row: t.row,
          errors: t.errors,
        })),
        summary: {
          successRate: parsedTransactions.length > 0
            ? ((created / parsedTransactions.length) * 100).toFixed(2) + '%'
            : '0%',
        },
      },
      `Processed ${parsedTransactions.length} M-Pesa transactions. Created ${created} sales records.`
    );
  } catch (error) {
    console.error('M-Pesa parsing error:', error);
    return sendError(
      res,
      error instanceof Error ? error.message : 'Failed to process M-Pesa statement',
      500
    );
  }
});

