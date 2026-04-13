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
const fileProcessor_1 = require("../../services/fileProcessor");
const ProductModel = __importStar(require("../../models/Product"));
// Mock ProductModel
jest.mock('../../models/Product', () => ({
    ProductModel: {
        findByUserId: jest.fn(),
    },
}));
describe('FileProcessor', () => {
    const mockUserId = 'user-123';
    const mockProducts = [
        { id: 'prod-1', name: 'Product A', sku: 'SKU-A', sellingPrice: 100 },
        { id: 'prod-2', name: 'Product B', sku: 'SKU-B', sellingPrice: 200 },
    ];
    beforeEach(() => {
        jest.clearAllMocks();
        ProductModel.ProductModel.findByUserId.mockResolvedValue({
            products: mockProducts,
            total: 2,
        });
    });
    describe('processCSV', () => {
        it('should process CSV file with valid data', async () => {
            const csvContent = `Date,Product,Quantity,Price
2024-01-15,Product A,5,100
2024-01-16,Product B,3,200`;
            const fileBuffer = Buffer.from(csvContent);
            const options = {
                userId: mockUserId,
                columnMapping: {
                    saleDate: 'Date',
                    productName: 'Product',
                    quantity: 'Quantity',
                    unitPrice: 'Price',
                },
                skipFirstRow: false, // Papa.parse with header: true already handles header row
            };
            const result = await fileProcessor_1.FileProcessor.processCSV(fileBuffer, options);
            expect(result.length).toBe(2);
            expect(result[0].data).toBeDefined();
            expect(result[0].data?.productId).toBe('prod-1');
            expect(result[0].data?.quantity).toBe(5);
            expect(result[0].data?.unitPrice).toBe(100);
        });
        it('should handle missing required fields', async () => {
            const csvContent = `Date,Product,Quantity
2024-01-15,Product A,5`;
            const fileBuffer = Buffer.from(csvContent);
            const options = {
                userId: mockUserId,
                columnMapping: {
                    saleDate: 'Date',
                    productName: 'Product',
                    quantity: 'Quantity',
                },
                skipFirstRow: false, // Papa.parse with header: true already handles header row
            };
            const result = await fileProcessor_1.FileProcessor.processCSV(fileBuffer, options);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0].errors.length).toBeGreaterThan(0);
            expect(result[0].errors.some(e => e.includes('price'))).toBeTruthy();
        });
        it('should calculate unit price from total amount', async () => {
            const csvContent = `Date,Product,Quantity,Total
2024-01-15,Product A,5,500`;
            const fileBuffer = Buffer.from(csvContent);
            const options = {
                userId: mockUserId,
                columnMapping: {
                    saleDate: 'Date',
                    productName: 'Product',
                    quantity: 'Quantity',
                    totalAmount: 'Total',
                },
                skipFirstRow: false, // Papa.parse with header: true already handles header row
            };
            const result = await fileProcessor_1.FileProcessor.processCSV(fileBuffer, options);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0].data).toBeDefined();
            expect(result[0].data?.unitPrice).toBe(100); // 500 / 5
        });
    });
    describe('detectHeaders', () => {
        it('should detect CSV headers', () => {
            const csvContent = `Date,Product Name,Quantity,Unit Price
2024-01-15,Product A,5,100`;
            const fileBuffer = Buffer.from(csvContent);
            const headers = fileProcessor_1.FileProcessor.detectHeaders(fileBuffer, 'csv');
            expect(headers).toEqual(['Date', 'Product Name', 'Quantity', 'Unit Price']);
        });
    });
});
//# sourceMappingURL=fileProcessor.test.js.map