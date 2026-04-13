import type { User } from '../types';

export type SubscriptionTier = User['subscriptionTier'];

export interface PricingPlan {
  tier: SubscriptionTier;
  name: string;
  monthlyPriceKes: number;
  annualDiscountPercent: number;
  tagline: string;
  features: string[];
}

export const PRICING_PLANS: Record<SubscriptionTier, PricingPlan> = {
  trial: {
    tier: 'trial',
    name: 'Trial',
    monthlyPriceKes: 0,
    annualDiscountPercent: 0,
    tagline: '14-day full-access trial',
    features: ['Core analytics', 'Forecasting', 'Offline sync'],
  },
  starter: {
    tier: 'starter',
    name: 'Starter',
    monthlyPriceKes: 1500,
    annualDiscountPercent: 15,
    tagline: 'Best for small traders',
    features: ['Up to 100 products', 'Up to 5 channels', 'Inventory optimization'],
  },
  growth: {
    tier: 'growth',
    name: 'Growth',
    monthlyPriceKes: 4500,
    annualDiscountPercent: 18,
    tagline: 'Best for e-commerce sellers',
    features: ['Up to 500 products', 'Competitor tracking', 'Advanced channel analytics'],
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    monthlyPriceKes: 12000,
    annualDiscountPercent: 20,
    tagline: 'Best for wholesalers',
    features: ['Up to 2500 products', 'Bulk operations', 'Priority support'],
  },
};
