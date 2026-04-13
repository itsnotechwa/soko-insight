/**
 * ML Service Integration
 * Communicates with Python ML microservice for forecasting and trends
 */

import axios, { AxiosInstance } from 'axios';

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

class MLService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Check if ML service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('ML Service health check failed:', error);
      return false;
    }
  }

  /**
   * Generate demand forecast
   */
  async forecast(request: ForecastRequest): Promise<ForecastResponse> {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/f95be562-4ac5-45c9-8b92-5fade3576870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mlService.ts:forecast',message:'Sending request to ML service',data:{productId:request.product_id,salesDataCount:request.sales_data.length,samplePoint:request.sales_data[0],allHaveDate:request.sales_data.every(d=>d.date),allHaveQuantity:request.sales_data.every(d=>typeof d.quantity==='number')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      const response = await this.client.post<ForecastResponse>('/api/forecast', request);
      return response.data;
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/f95be562-4ac5-45c9-8b92-5fade3576870',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mlService.ts:forecast',message:'ML service error',data:{errorMessage:error.message,responseData:error.response?.data,status:error.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (error.response) {
        throw new Error(`ML Service error: ${error.response.data.detail || error.response.statusText}`);
      }
      throw new Error(`Failed to connect to ML Service: ${error.message}`);
    }
  }

  /**
   * Get Google Trends data
   */
  async getTrends(request: TrendsRequest): Promise<TrendsResponse> {
    try {
      const response = await this.client.post<TrendsResponse>('/api/trends', {
        keywords: request.keywords,
        geo: request.geo || 'KE',
        timeframe: request.timeframe || 'today 12-m',
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`ML Service error: ${error.response.data.detail || error.response.statusText}`);
      }
      throw new Error(`Failed to connect to ML Service: ${error.message}`);
    }
  }

  /**
   * Optimize inventory levels
   */
  async optimizeInventory(request: InventoryOptimizationRequest): Promise<InventoryOptimizationResponse> {
    try {
      const response = await this.client.post<InventoryOptimizationResponse>('/api/inventory/optimize', {
        product_id: request.product_id,
        current_stock: request.current_stock,
        reorder_level: request.reorder_level,
        forecasted_demand: request.forecasted_demand,
        lead_time_days: request.lead_time_days || 7,
        safety_stock_percentage: request.safety_stock_percentage || 0.2,
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`ML Service error: ${error.response.data.detail || error.response.statusText}`);
      }
      throw new Error(`Failed to connect to ML Service: ${error.message}`);
    }
  }
}

export const mlService = new MLService();

