import api, { getErrorMessage } from './api';
import { ApiResponse, TrendsData } from '../types';

export const trendsService = {
  // Get Google Trends
  async getTrends(keywords: string[], geo: string = 'KE', timeframe: string = 'today 12-m'): Promise<ApiResponse<TrendsData>> {
    try {
      const response = await api.post('/trends', { keywords, geo, timeframe });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

