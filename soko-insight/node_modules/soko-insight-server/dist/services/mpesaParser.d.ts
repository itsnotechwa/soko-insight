import { CreateSalesDataInput } from '../models/SalesData';
export interface MpesaTransaction {
    completionTime: Date;
    details: string;
    transactionStatus: string;
    msisdn: string;
    receiptNumber: string;
    amount: number;
    transactionType: string;
}
export interface MpesaParsingOptions {
    userId: string;
    channelId?: string;
    minAmount?: number;
    excludeWithdrawals?: boolean;
}
export interface ParsedMpesaTransaction {
    row: number;
    transaction: MpesaTransaction | null;
    salesData: CreateSalesDataInput | null;
    errors: string[];
}
export declare class MpesaParser {
    /**
     * Parse M-Pesa CSV statement
     * Typical M-Pesa CSV format:
     * Receipt No.,Completion Time,Details,Transaction Status,Reason Type,Transaction Type,From,To,Amount (KSh)
     */
    static parseCSV(fileBuffer: Buffer, options: MpesaParsingOptions): Promise<ParsedMpesaTransaction[]>;
    /**
     * Detect header mapping for M-Pesa CSV
     */
    private static detectHeaders;
    /**
     * Get field value from row
     */
    private static getField;
    /**
     * Parse M-Pesa date format
     * Common formats: "12/31/2023 10:30 AM" or "2023-12-31 10:30:00"
     */
    private static parseMpesaDate;
    /**
     * Parse amount string (remove currency symbols, commas)
     */
    private static parseAmount;
    /**
     * Match M-Pesa transaction to products based on amount or details
     * This is a simple implementation - can be enhanced with ML or pattern matching
     */
    static matchToProducts(transactions: ParsedMpesaTransaction[], productPrices: Map<number, string>): Promise<ParsedMpesaTransaction[]>;
}
//# sourceMappingURL=mpesaParser.d.ts.map