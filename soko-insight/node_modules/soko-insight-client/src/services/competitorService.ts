import api, { getErrorMessage } from './api';
import { ApiResponse, Competitor, CompetitorPrice, CreateCompetitorInput, PriceComparison } from '../types';

export const competitorService = {
  // Get all competitors
  async getCompetitors(params?: {
    page?: number;
    limit?: number;
    search?: string;
    platform?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<{ competitors: Competitor[]; total: number }>> {
    try {
      const response = await api.get('/competitors', { params });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Get single competitor
  async getCompetitor(id: string): Promise<ApiResponse<Competitor>> {
    try {
      const response = await api.get(`/competitors/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Create competitor
  async createCompetitor(data: CreateCompetitorInput): Promise<ApiResponse<Competitor>> {
    try {
      const response = await api.post('/competitors', data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Update competitor
  async updateCompetitor(id: string, data: Partial<CreateCompetitorInput & { isActive?: boolean }>): Promise<ApiResponse<Competitor>> {
    try {
      const response = await api.put(`/competitors/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Delete competitor
  async deleteCompetitor(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await api.delete(`/competitors/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Add competitor price
  async addPrice(data: { productId: string; competitorId: string; price: number }): Promise<ApiResponse<CompetitorPrice>> {
    try {
      const response = await api.post('/competitors/prices', data);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Get price comparison
  async getPriceComparison(productId: string): Promise<ApiResponse<PriceComparison>> {
    try {
      const response = await api.get(`/competitors/prices/comparison/${productId}`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Get price history
  async getPriceHistory(productId: string, competitorId: string, days: number = 30): Promise<ApiResponse<CompetitorPrice[]>> {
    try {
      const response = await api.get(`/competitors/prices/history/${productId}/${competitorId}`, {
        params: { days },
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};

