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
exports.MpesaParser = void 0;
const Papa = __importStar(require("papaparse"));
class MpesaParser {
    /**
     * Parse M-Pesa CSV statement
     * Typical M-Pesa CSV format:
     * Receipt No.,Completion Time,Details,Transaction Status,Reason Type,Transaction Type,From,To,Amount (KSh)
     */
    static async parseCSV(fileBuffer, options) {
        const csvText = fileBuffer.toString('utf-8');
        const parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
        });
        const results = [];
        // Map column names (M-Pesa exports can vary)
        const headerMap = this.detectHeaders(parsed.meta.fields || []);
        for (let i = 0; i < parsed.data.length; i++) {
            const row = parsed.data[i];
            const rowNumber = i + 2; // +2 because CSV is 1-indexed and we skip header
            const errors = [];
            const result = {
                row: rowNumber,
                transaction: null,
                salesData: null,
                errors,
            };
            try {
                // Extract transaction data
                const receiptNo = this.getField(row, headerMap.receiptNo);
                const completionTimeStr = this.getField(row, headerMap.completionTime);
                const details = this.getField(row, headerMap.details);
                const transactionStatus = this.getField(row, headerMap.transactionStatus);
                const transactionType = this.getField(row, headerMap.transactionType);
                const from = this.getField(row, headerMap.from);
                const to = this.getField(row, headerMap.to);
                const amountStr = this.getField(row, headerMap.amount);
                // Validate required fields
                if (!completionTimeStr)
                    errors.push('Completion time is required');
                if (!amountStr)
                    errors.push('Amount is required');
                if (!receiptNo)
                    errors.push('Receipt number is required');
                if (errors.length > 0) {
                    result.errors = errors;
                    results.push(result);
                    continue;
                }
                // Parse date (completionTimeStr is guaranteed non-null due to validation above)
                const completionTime = this.parseMpesaDate(completionTimeStr);
                if (!completionTime || isNaN(completionTime.getTime())) {
                    errors.push(`Invalid date format: ${completionTimeStr}`);
                    result.errors = errors;
                    results.push(result);
                    continue;
                }
                // Parse amount (amountStr is guaranteed non-null due to validation above)
                const amount = this.parseAmount(amountStr);
                if (amount === null) {
                    errors.push(`Invalid amount: ${amountStr}`);
                    result.errors = errors;
                    results.push(result);
                    continue;
                }
                // Filter transactions
                if (options.excludeWithdrawals && transactionType?.toLowerCase().includes('withdrawal')) {
                    // Skip withdrawals
                    continue;
                }
                // Only process payments received (positive amounts)
                if (amount <= 0) {
                    continue;
                }
                // Apply minimum amount filter
                if (options.minAmount && amount < options.minAmount) {
                    continue;
                }
                // Check transaction status (only process completed transactions)
                if (transactionStatus && !transactionStatus.toLowerCase().includes('completed')) {
                    continue;
                }
                // Create transaction object (receiptNo is guaranteed to be non-null here due to validation above)
                const transaction = {
                    completionTime,
                    details: details || '',
                    transactionStatus: transactionStatus || '',
                    msisdn: from || to || '',
                    receiptNumber: receiptNo, // Non-null assertion: validated above
                    amount,
                    transactionType: transactionType || '',
                };
                result.transaction = transaction;
                // Convert to sales data (M-Pesa payments are typically quantity 1, unit price = amount)
                result.salesData = {
                    userId: options.userId,
                    channelId: options.channelId,
                    saleDate: completionTime,
                    quantity: 1, // M-Pesa transactions are typically single unit sales
                    unitPrice: amount,
                    entryMethod: 'mpesa',
                    notes: `M-Pesa Receipt: ${receiptNo}. ${details || ''}`,
                };
                results.push(result);
            }
            catch (error) {
                result.errors.push(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                results.push(result);
            }
        }
        return results.filter((r) => r.transaction !== null || r.errors.length > 0);
    }
    /**
     * Detect header mapping for M-Pesa CSV
     */
    static detectHeaders(headers) {
        const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
        const mapping = {
            receiptNo: null,
            completionTime: null,
            details: null,
            transactionStatus: null,
            transactionType: null,
            from: null,
            to: null,
            amount: null,
        };
        // Common M-Pesa CSV header patterns
        const patterns = {
            receiptNo: ['receipt', 'receipt no', 'receipt no.', 'receipt number'],
            completionTime: ['completion time', 'completion', 'date', 'time'],
            details: ['details', 'description', 'narration'],
            transactionStatus: ['transaction status', 'status', 'state'],
            transactionType: ['transaction type', 'type'],
            from: ['from', 'sender', 'paid from'],
            to: ['to', 'recipient', 'paid to'],
            amount: ['amount', 'amount (ksh)', 'amount(ksh)', 'value'],
        };
        Object.entries(patterns).forEach(([key, patternList]) => {
            const foundIndex = lowerHeaders.findIndex((h) => patternList.some((p) => h.includes(p)));
            if (foundIndex !== -1) {
                mapping[key] = headers[foundIndex];
            }
        });
        return mapping;
    }
    /**
     * Get field value from row
     */
    static getField(row, fieldName) {
        if (!fieldName)
            return null;
        const value = row[fieldName];
        return value !== null && value !== undefined ? String(value).trim() : null;
    }
    /**
     * Parse M-Pesa date format
     * Common formats: "12/31/2023 10:30 AM" or "2023-12-31 10:30:00"
     */
    static parseMpesaDate(dateStr) {
        if (!dateStr)
            return null;
        // Try various date formats
        const formats = [
            /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i, // MM/DD/YYYY HH:MM AM/PM
            /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/, // YYYY-MM-DD HH:MM:SS
            /(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/, // DD-MM-YYYY HH:MM
        ];
        // Try JavaScript Date parsing first (handles most formats)
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date;
        }
        return null;
    }
    /**
     * Parse amount string (remove currency symbols, commas)
     */
    static parseAmount(amountStr) {
        if (!amountStr)
            return null;
        // Remove currency symbols, commas, and whitespace
        const cleaned = amountStr.replace(/[^\d.-]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : Math.abs(num); // Always return positive
    }
    /**
     * Match M-Pesa transaction to products based on amount or details
     * This is a simple implementation - can be enhanced with ML or pattern matching
     */
    static async matchToProducts(transactions, productPrices // price -> productId
    ) {
        return transactions.map((parsed) => {
            if (!parsed.salesData || !parsed.transaction) {
                return parsed;
            }
            const amount = parsed.transaction.amount;
            // Try to match by exact price
            if (productPrices.has(amount)) {
                parsed.salesData.productId = productPrices.get(amount);
            }
            return parsed;
        });
    }
}
exports.MpesaParser = MpesaParser;
//# sourceMappingURL=mpesaParser.js.map