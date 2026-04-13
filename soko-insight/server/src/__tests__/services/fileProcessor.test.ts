import { FileProcessor } from '../../services/fileProcessor';
import * as ProductModel from '../../models/Product';

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
    (ProductModel.ProductModel.findByUserId as jest.Mock).mockResolvedValue({
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

      const result = await FileProcessor.processCSV(fileBuffer, options);

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

      const result = await FileProcessor.processCSV(fileBuffer, options);

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

      const result = await FileProcessor.processCSV(fileBuffer, options);

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
      const headers = FileProcessor.detectHeaders(fileBuffer, 'csv');

      expect(headers).toEqual(['Date', 'Product Name', 'Quantity', 'Unit Price']);
    });
  });
});

