import api, { getErrorMessage } from './api';
import { ApiResponse, Forecast, InventoryOptimization } from '../types';

export const forecastService = {
  // Get forecast for a product
  async getProductForecast(productId: string, days: number = 7, model: 'prophet' | 'sma' = 'prophet'): Promise<ApiResponse<Forecast>> {
    try {
      const response = await api.get(`/forecast/product/${productId}`, {
        params: { days, model },
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Get inventory optimization
  async getInventoryOptimization(
    productId: string,
    leadTimeDays: number = 7,
    safetyStockPercentage: number = 0.2
  ): Promise<ApiResponse<InventoryOptimization>> {
    try {
      const response = await api.get(`/forecast/inventory/${productId}`, {
        params: { leadTimeDays, safetyStockPercentage },
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Bulk forecast
  async getBulkForecast(productIds: string[], days: number = 7, model: 'prophet' | 'sma' = 'prophet'): Promise<ApiResponse<{ forecasts: Forecast[] }>> {
    try {
      const response = await api.post('/forecast/bulk', { productIds }, {
        params: { days, model },
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

