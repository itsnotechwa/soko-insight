import { Request, Response } from 'express';
import * as salesController from '../../controllers/salesController';
import * as SalesDataModel from '../../models/SalesData';
import * as FileProcessor from '../../services/fileProcessor';
import { ProductModel } from '../../models/Product';

// Mock dependencies
jest.mock('../../models/SalesData');
jest.mock('../../services/fileProcessor');
jest.mock('../../models/Product', () => ({
  ProductModel: {
    findById: jest.fn(),
    updateStock: jest.fn(),
  },
}));

describe('SalesController - File Upload', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        businessName: 'Test Business',
        sellerType: 'small_trader',
        subscriptionTier: 'free',
      } as any,
      file: {
        buffer: Buffer.from('test'),
        originalname: 'test.csv',
      } as Express.Multer.File,
      body: {},
    };

    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as any;

    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('detectHeaders', () => {
    it('should detect headers from CSV file', async () => {
      const mockHeaders = ['Date', 'Product', 'Quantity', 'Price'];
      (FileProcessor.FileProcessor.detectHeaders as jest.Mock).mockReturnValue(mockHeaders);

      await salesController.detectHeaders(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            headers: mockHeaders,
          }),
        })
      );
    });
  });

  describe('uploadFile', () => {
    it('should process and upload CSV file', async () => {
      const mockProcessedRows = [
        {
          row: 1,
          data: {
            userId: 'user-123',
            saleDate: new Date('2024-01-15'),
            quantity: 5,
            unitPrice: 100,
            entryMethod: 'csv' as const,
          },
          errors: [],
        },
      ];

      mockReq.body = {
        columnMapping: JSON.stringify({
          saleDate: 'Date',
          quantity: 'Quantity',
          unitPrice: 'Price',
        }),
        skipFirstRow: 'true',
      };

      (FileProcessor.FileProcessor.processCSV as jest.Mock).mockResolvedValue(mockProcessedRows);
      (ProductModel.findById as jest.Mock).mockResolvedValue(null); // No product found, so no cost calculation
      (ProductModel.updateStock as jest.Mock).mockResolvedValue(undefined);
      (SalesDataModel.SalesDataModel.create as jest.Mock).mockResolvedValue({ id: 'sale-1' });

      // asyncHandler returns void but starts async operation, so we need to wait for it
      salesController.uploadFile(mockReq as Request, mockRes as Response, mockNext);
      
      // Wait for async operation to complete
      await new Promise(resolve => setImmediate(resolve));

      // Check if next was called with an error (would indicate asyncHandler caught an error)
      if (mockNext.mock.calls.length > 0 && mockNext.mock.calls[0][0]) {
        const error = mockNext.mock.calls[0][0];
        throw new Error(`Handler threw error: ${error.message || error}`);
      }

      expect(FileProcessor.FileProcessor.processCSV).toHaveBeenCalled();
      
      // sendSuccess calls res.status(200).json(response)
      // Since status() returns this, json() should be called on the response object
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
      
      // Check that json was called with the correct structure
      const jsonCall = (mockRes.json as jest.Mock).mock.calls[0];
      expect(jsonCall[0]).toMatchObject({
        success: true,
        data: expect.objectContaining({
          total: 1,
          created: 1,
        }),
      });
    });

    it('should return error for missing column mapping', async () => {
      mockReq.body = {};

      await salesController.uploadFile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});

