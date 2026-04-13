import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';
import { CreateSalesDataInput } from '../models/SalesData';
import { ProductModel } from '../models/Product';

export interface ColumnMapping {
  productName?: string;
  productSku?: string;
  saleDate?: string;
  quantity?: string;
  unitPrice?: string;
  totalAmount?: string;
  channelName?: string;
  notes?: string;
}

export interface FileProcessingOptions {
  userId: string;
  channelId?: string;
  defaultChannelId?: string;
  columnMapping: ColumnMapping;
  skipFirstRow?: boolean;
  dateFormat?: string;
}

export interface ProcessedRow {
  row: number;
  data: CreateSalesDataInput | null;
  errors: string[];
}

export class FileProcessor {
  /**
   * Process CSV file
   */
  static async processCSV(
    fileBuffer: Buffer,
    options: FileProcessingOptions
  ): Promise<ProcessedRow[]> {
    const csvText = fileBuffer.toString('utf-8');
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    return this.processRows(parsed.data as Record<string, any>[], options);
  }

  /**
   * Process Excel file
   */
  static async processExcel(
    fileBuffer: Buffer,
    options: FileProcessingOptions
  ): Promise<ProcessedRow[]> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet, { defval: null });

    return this.processRows(data as Record<string, any>[], options);
  }

  /**
   * Process rows from parsed file data
   */
  private static async processRows(
    rows: Record<string, any>[],
    options: FileProcessingOptions
  ): Promise<ProcessedRow[]> {
    const processed: ProcessedRow[] = [];
    const startIndex = options.skipFirstRow ? 1 : 0;

    // Get all products for the user to match by name/SKU
    const productsResult = await ProductModel.findByUserId(options.userId, { limit: 1000 });
    const productMap = new Map<string, string>();
    productsResult.products.forEach((p) => {
      if (p.name) productMap.set(p.name.toLowerCase().trim(), p.id);
      if (p.sku) productMap.set(p.sku.toLowerCase().trim(), p.id);
    });

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;
      const errors: string[] = [];
      const result: ProcessedRow = { row: rowNumber, data: null, errors };

      try {
        // Extract values based on column mapping
        const productName = this.getMappedValue(row, options.columnMapping.productName);
        const productSku = this.getMappedValue(row, options.columnMapping.productSku);
        const saleDateStr = this.getMappedValue(row, options.columnMapping.saleDate);
        const quantityStr = this.getMappedValue(row, options.columnMapping.quantity);
        const unitPriceStr = this.getMappedValue(row, options.columnMapping.unitPrice);
        const totalAmountStr = this.getMappedValue(row, options.columnMapping.totalAmount);
        const channelName = this.getMappedValue(row, options.columnMapping.channelName);
        const notes = this.getMappedValue(row, options.columnMapping.notes);

        // Validate required fields
        if (!saleDateStr) errors.push('Sale date is required');
        if (!quantityStr) errors.push('Quantity is required');
        if (!unitPriceStr && !totalAmountStr) {
          errors.push('Either unit price or total amount is required');
        }

        if (errors.length > 0) {
          result.errors = errors;
          processed.push(result);
          continue;
        }

        // Parse sale date (we've validated saleDateStr is not null above)
        const saleDate = this.parseDate(saleDateStr!, options.dateFormat);
        if (!saleDate || isNaN(saleDate.getTime())) {
          errors.push(`Invalid date format: ${saleDateStr}`);
          result.errors = errors;
          processed.push(result);
          continue;
        }

        // Parse quantity (we've validated quantityStr is not null above)
        const quantity = this.parseNumber(quantityStr!);
        if (quantity === null || quantity <= 0) {
          errors.push(`Invalid quantity: ${quantityStr}`);
          result.errors = errors;
          processed.push(result);
          continue;
        }

        // Parse price - use unit price if available, otherwise calculate from total
        let unitPrice = unitPriceStr ? this.parseNumber(unitPriceStr) : null;
        if (unitPrice === null) {
          if (!totalAmountStr) {
            errors.push('Either unit price or total amount is required');
            result.errors = errors;
            processed.push(result);
            continue;
          }
          const totalAmount = this.parseNumber(totalAmountStr);
          if (totalAmount === null || totalAmount <= 0) {
            errors.push(`Invalid price: ${totalAmountStr}`);
            result.errors = errors;
            processed.push(result);
            continue;
          }
          unitPrice = totalAmount / quantity;
        }

        // Find product by name or SKU
        let productId: string | undefined;
        if (productName) {
          productId = productMap.get(productName.toLowerCase().trim());
          if (!productId && productSku) {
            productId = productMap.get(productSku.toLowerCase().trim());
          }
        } else if (productSku) {
          productId = productMap.get(productSku.toLowerCase().trim());
        }

        // Use provided channelId or default
        let channelId = options.channelId || options.defaultChannelId || undefined;

        // Create sales data input
        result.data = {
          userId: options.userId,
          productId,
          channelId,
          saleDate,
          quantity,
          unitPrice,
          entryMethod: 'csv',
          notes: notes || undefined,
        };

        processed.push(result);
      } catch (error) {
        result.errors.push(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        processed.push(result);
      }
    }

    return processed;
  }

  /**
   * Get value from row based on column mapping
   */
  private static getMappedValue(row: Record<string, any>, mappedColumn?: string): string | null {
    if (!mappedColumn) return null;
    
    // Try exact match first
    if (row[mappedColumn] !== undefined && row[mappedColumn] !== null) {
      return String(row[mappedColumn]).trim();
    }

    // Try case-insensitive match
    const lowerKey = mappedColumn.toLowerCase();
    for (const key in row) {
      if (key.toLowerCase() === lowerKey) {
        const value = row[key];
        return value !== null && value !== undefined ? String(value).trim() : null;
      }
    }

    return null;
  }

  /**
   * Parse date string
   */
  private static parseDate(dateStr: string | null, format?: string): Date | null {
    if (!dateStr) return null;

    // Try various date formats
    const formats = format ? [format] : [
      'YYYY-MM-DD',
      'DD/MM/YYYY',
      'MM/DD/YYYY',
      'DD-MM-YYYY',
      'MM-DD-YYYY',
      'YYYY/MM/DD',
    ];

    for (const fmt of formats) {
      try {
        // Simple date parsing (can be enhanced with date-fns or moment)
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch (e) {
        continue;
      }
    }

    // Fallback to JavaScript Date parsing
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Parse number string
   */
  private static parseNumber(numStr: string): number | null {
    if (!numStr) return null;
    
    // Remove currency symbols and commas
    const cleaned = numStr.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    
    return isNaN(num) ? null : num;
  }

  /**
   * Detect duplicate sales records
   */
  static async detectDuplicates(
    records: CreateSalesDataInput[],
    userId: string,
    lookbackDays: number = 30
  ): Promise<{ isDuplicate: boolean; duplicateCount: number }[]> {
    const results = [];
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

    // Check each record for duplicates
    for (const record of records) {
      // Query for potential duplicates
      // This would need to query the database for similar records
      // For now, return a placeholder
      results.push({ isDuplicate: false, duplicateCount: 0 });
    }

    return results;
  }

  /**
   * Detect column headers in a file
   */
  static detectHeaders(fileBuffer: Buffer, fileType: 'csv' | 'xlsx'): string[] {
    if (fileType === 'csv') {
      const csvText = fileBuffer.toString('utf-8');
      const parsed = Papa.parse(csvText, { header: false, preview: 1 });
      return parsed.data[0] as string[] || [];
    } else {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const range = XLSX.utils.decode_range(firstSheet['!ref'] || 'A1');
      const headers: string[] = [];
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = firstSheet[cellAddress];
        headers.push(cell ? String(cell.v || '') : '');
      }
      
      return headers;
    }
  }
}

