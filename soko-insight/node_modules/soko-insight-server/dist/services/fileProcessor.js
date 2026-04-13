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
exports.FileProcessor = void 0;
const XLSX = __importStar(require("xlsx"));
const Papa = __importStar(require("papaparse"));
const Product_1 = require("../models/Product");
class FileProcessor {
    /**
     * Process CSV file
     */
    static async processCSV(fileBuffer, options) {
        const csvText = fileBuffer.toString('utf-8');
        const parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
        });
        return this.processRows(parsed.data, options);
    }
    /**
     * Process Excel file
     */
    static async processExcel(fileBuffer, options) {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { defval: null });
        return this.processRows(data, options);
    }
    /**
     * Process rows from parsed file data
     */
    static async processRows(rows, options) {
        const processed = [];
        const startIndex = options.skipFirstRow ? 1 : 0;
        // Get all products for the user to match by name/SKU
        const productsResult = await Product_1.ProductModel.findByUserId(options.userId, { limit: 1000 });
        const productMap = new Map();
        productsResult.products.forEach((p) => {
            if (p.name)
                productMap.set(p.name.toLowerCase().trim(), p.id);
            if (p.sku)
                productMap.set(p.sku.toLowerCase().trim(), p.id);
        });
        for (let i = startIndex; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 1;
            const errors = [];
            const result = { row: rowNumber, data: null, errors };
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
                if (!saleDateStr)
                    errors.push('Sale date is required');
                if (!quantityStr)
                    errors.push('Quantity is required');
                if (!unitPriceStr && !totalAmountStr) {
                    errors.push('Either unit price or total amount is required');
                }
                if (errors.length > 0) {
                    result.errors = errors;
                    processed.push(result);
                    continue;
                }
                // Parse sale date (we've validated saleDateStr is not null above)
                const saleDate = this.parseDate(saleDateStr, options.dateFormat);
                if (!saleDate || isNaN(saleDate.getTime())) {
                    errors.push(`Invalid date format: ${saleDateStr}`);
                    result.errors = errors;
                    processed.push(result);
                    continue;
                }
                // Parse quantity (we've validated quantityStr is not null above)
                const quantity = this.parseNumber(quantityStr);
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
                let productId;
                if (productName) {
                    productId = productMap.get(productName.toLowerCase().trim());
                    if (!productId && productSku) {
                        productId = productMap.get(productSku.toLowerCase().trim());
                    }
                }
                else if (productSku) {
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
            }
            catch (error) {
                result.errors.push(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                processed.push(result);
            }
        }
        return processed;
    }
    /**
     * Get value from row based on column mapping
     */
    static getMappedValue(row, mappedColumn) {
        if (!mappedColumn)
            return null;
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
    static parseDate(dateStr, format) {
        if (!dateStr)
            return null;
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
            }
            catch (e) {
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
    static parseNumber(numStr) {
        if (!numStr)
            return null;
        // Remove currency symbols and commas
        const cleaned = numStr.replace(/[^\d.-]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
    }
    /**
     * Detect duplicate sales records
     */
    static async detectDuplicates(records, userId, lookbackDays = 30) {
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
    static detectHeaders(fileBuffer, fileType) {
        if (fileType === 'csv') {
            const csvText = fileBuffer.toString('utf-8');
            const parsed = Papa.parse(csvText, { header: false, preview: 1 });
            return parsed.data[0] || [];
        }
        else {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const range = XLSX.utils.decode_range(firstSheet['!ref'] || 'A1');
            const headers = [];
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                const cell = firstSheet[cellAddress];
                headers.push(cell ? String(cell.v || '') : '');
            }
            return headers;
        }
    }
}
exports.FileProcessor = FileProcessor;
//# sourceMappingURL=fileProcessor.js.map