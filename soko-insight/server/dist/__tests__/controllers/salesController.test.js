"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const salesController = __importStar(require("../../controllers/salesController"));
const SalesDataModel = __importStar(require("../../models/SalesData"));
const FileProcessor = __importStar(require("../../services/fileProcessor"));
const Product_1 = require("../../models/Product");
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
    let mockReq;
    let mockRes;
    let mockNext;
    beforeEach(() => {
        mockReq = {
            user: {
                id: 'user-123',
                email: 'test@example.com',
                businessName: 'Test Business',
                sellerType: 'small_trader',
                subscriptionTier: 'free',
            },
            file: {
                buffer: Buffer.from('test'),
                originalname: 'test.csv',
            },
            body: {},
        };
        mockRes = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });
    describe('detectHeaders', () => {
        it('should detect headers from CSV file', async () => {
            const mockHeaders = ['Date', 'Product', 'Quantity', 'Price'];
            FileProcessor.FileProcessor.detectHeaders.mockReturnValue(mockHeaders);
            await salesController.detectHeaders(mockReq, mockRes, mockNext);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    headers: mockHeaders,
                }),
            }));
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
                        entryMethod: 'csv',
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
            FileProcessor.FileProcessor.processCSV.mockResolvedValue(mockProcessedRows);
            Product_1.ProductModel.findById.mockResolvedValue(null); // No product found, so no cost calculation
            Product_1.ProductModel.updateStock.mockResolvedValue(undefined);
            SalesDataModel.SalesDataModel.create.mockResolvedValue({ id: 'sale-1' });
            // asyncHandler returns void but starts async operation, so we need to wait for it
            salesController.uploadFile(mockReq, mockRes, mockNext);
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
            const jsonCall = mockRes.json.mock.calls[0];
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
            await salesController.uploadFile(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });
});
//# sourceMappingURL=salesController.test.js.map