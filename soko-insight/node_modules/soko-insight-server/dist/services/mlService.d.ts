/**
 * ML Service Integration
 * Communicates with Python ML microservice for forecasting and trends
 */
export interface SalesDataPoint {
    date: string;
    quantity: number;
    revenue?: number;
}
export interface ForecastRequest {
    product_id: string;
    sales_data: SalesDataPoint[];
    forecast_days: number;
    model?: 'sarima' | 'sma';
}
export interface ForecastResponse {
    product_id: string;
    forecasts: Array<{
        date: string;
        predicted_demand: number;
        confidence: number;
    }>;
    model_used: string;
    confidence: number;
    message?: string;
}
export interface TrendsRequest {
    keywords: string[];
    geo?: string;
    timeframe?: string;
}
export interface TrendsResponse {
    keywords: string[];
    data: {
        interest_over_time: Record<string, Record<string, number>>;
        summary: Record<string, {
            average: number;
            max: number;
            min: number;
            latest: number;
            trend: string;
        }>;
        related_queries: Record<string, any>;
        trending_searches: any[];
    };
    timeframe: string;
    geo: string;
}
export interface InventoryOptimizationRequest {
    product_id: string;
    current_stock: number;
    reorder_level: number;
    forecasted_demand: number;
    lead_time_days?: number;
    safety_stock_percentage?: number;
}
export interface InventoryOptimizationResponse {
    product_id: string;
    current_stock: number;
    recommended_stock: number;
    order_quantity: number;
    recommendation: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    days_remaining?: number;
    safety_stock?: number;
}
declare class MLService {
    private client;
    private baseUrl;
    constructor();
    /**
     * Check if ML service is available
     */
    healthCheck(): Promise<boolean>;
    /**
     * Generate demand forecast
     */
    forecast(request: ForecastRequest): Promise<ForecastResponse>;
    /**
     * Get Google Trends data
     */
    getTrends(request: TrendsRequest): Promise<TrendsResponse>;
    /**
     * Optimize inventory levels
     */
    optimizeInventory(request: InventoryOptimizationRequest): Promise<InventoryOptimizationResponse>;
}
export declare const mlService: MLService;
export {};
//# sourceMappingURL=mlService.d.ts.map