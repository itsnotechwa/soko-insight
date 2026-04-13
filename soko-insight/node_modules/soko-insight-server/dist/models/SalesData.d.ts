export interface SalesData {
    id: string;
    userId: string;
    productId: string | null;
    channelId: string | null;
    saleDate: Date;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    costAmount: number;
    profitAmount: number;
    entryMethod: 'manual' | 'csv' | 'mpesa' | 'api' | 'quick_entry';
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateSalesDataInput {
    userId: string;
    productId?: string;
    channelId?: string;
    saleDate: Date;
    quantity: number;
    unitPrice: number;
    costAmount?: number;
    entryMethod?: 'manual' | 'csv' | 'mpesa' | 'api' | 'quick_entry';
    notes?: string;
}
export interface SalesDataWithDetails extends SalesData {
    productName?: string;
    channelName?: string;
}
export declare class SalesDataModel {
    static findById(id: string, userId?: string): Promise<SalesData | null>;
    static findByUserId(userId: string, options?: {
        page?: number;
        limit?: number;
        startDate?: Date;
        endDate?: Date;
        productId?: string;
        channelId?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        sales: SalesDataWithDetails[];
        total: number;
    }>;
    static create(input: CreateSalesDataInput): Promise<SalesData>;
    static bulkCreate(records: CreateSalesDataInput[]): Promise<{
        created: number;
        failed: number;
    }>;
    static delete(id: string, userId: string): Promise<boolean>;
    static getSummary(userId: string, startDate?: Date, endDate?: Date): Promise<{
        totalRevenue: number;
        totalProfit: number;
        totalOrders: number;
        totalQuantity: number;
    }>;
    static getDailySales(userId: string, startDate: Date, endDate: Date): Promise<{
        date: string;
        revenue: number;
        orders: number;
    }[]>;
    static getTopProducts(userId: string, limit?: number, startDate?: Date, endDate?: Date): Promise<{
        productId: string;
        productName: string;
        revenue: number;
        quantity: number;
    }[]>;
    static getSalesByChannel(userId: string, startDate?: Date, endDate?: Date): Promise<{
        channelId: string;
        channelName: string;
        revenue: number;
        orders: number;
    }[]>;
}
//# sourceMappingURL=SalesData.d.ts.map