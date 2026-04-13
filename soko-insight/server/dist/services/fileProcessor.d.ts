import { CreateSalesDataInput } from '../models/SalesData';
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
export declare class FileProcessor {
    /**
     * Process CSV file
     */
    static processCSV(fileBuffer: Buffer, options: FileProcessingOptions): Promise<ProcessedRow[]>;
    /**
     * Process Excel file
     */
    static processExcel(fileBuffer: Buffer, options: FileProcessingOptions): Promise<ProcessedRow[]>;
    /**
     * Process rows from parsed file data
     */
    private static processRows;
    /**
     * Get value from row based on column mapping
     */
    private static getMappedValue;
    /**
     * Parse date string
     */
    private static parseDate;
    /**
     * Parse number string
     */
    private static parseNumber;
    /**
     * Detect duplicate sales records
     */
    static detectDuplicates(records: CreateSalesDataInput[], userId: string, lookbackDays?: number): Promise<{
        isDuplicate: boolean;
        duplicateCount: number;
    }[]>;
    /**
     * Detect column headers in a file
     */
    static detectHeaders(fileBuffer: Buffer, fileType: 'csv' | 'xlsx'): string[];
}
//# sourceMappingURL=fileProcessor.d.ts.map