import api from './api';
import { ApiResponse, AuthResponse, User } from '../types';
import type { SubscriptionTier } from '../config/pricing';

export interface RegisterInput {
  email: string;
  password: string;
  businessName: string;
  phone?: string;
  sellerType: 'small_trader' | 'ecommerce' | 'wholesaler';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  businessName?: string;
  phone?: string;
  languagePreference?: 'en' | 'sw';
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}

export interface PricingPlan {
  tier: SubscriptionTier;
  displayName: string;
  monthlyPriceKes: number;
  annualDiscountPercent: number;
  trialDays?: number;
  recommendedFor: Array<'small_trader' | 'ecommerce' | 'wholesaler'>;
  features: string[];
  limits: {
    maxProducts: number;
    maxSalesChannels: number;
    monthlyForecastRuns: number;
    competitorChecksPerMonth: number;
    maxTeamMembers: number;
  };
}

export const authService = {
  // Register new user
  async register(data: RegisterInput): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data!;
  },

  // Login user
  async login(data: LoginInput): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data!;
  },

  // Get current user
  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },

  // Update profile
  async updateProfile(data: UpdateProfileInput): Promise<User> {
    const response = await api.put<ApiResponse<User>>('/auth/profile', data);
    return response.data.data!;
  },

  // Get pricing plans
  async getPlans(): Promise<{ currency: string; plans: PricingPlan[] }> {
    const response = await api.get<ApiResponse<{ currency: string; plans: PricingPlan[] }>>('/auth/plans');
    return response.data.data!;
  },

  // Update subscription tier
  async updateSubscription(subscriptionTier: SubscriptionTier): Promise<AuthResponse> {
    const response = await api.put<ApiResponse<AuthResponse>>('/auth/subscription', { subscriptionTier });
    return response.data.data!;
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ token: string }> {
    const response = await api.put<ApiResponse<{ token: string }>>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data.data!;
  },

  // Deactivate account
  async deactivateAccount(password: string): Promise<void> {
    await api.post('/auth/deactivate', { password });
  },
};

