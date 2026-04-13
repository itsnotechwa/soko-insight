"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SUBSCRIPTION_BY_SELLER_TYPE = exports.PRICING_PLANS = void 0;
exports.getDefaultSubscriptionTier = getDefaultSubscriptionTier;
exports.PRICING_PLANS = {
    trial: {
        tier: 'trial',
        displayName: 'Trial',
        monthlyPriceKes: 0,
        annualDiscountPercent: 0,
        trialDays: 14,
        recommendedFor: ['small_trader', 'ecommerce', 'wholesaler'],
        features: [
            'All core analytics and forecasting features',
            'Offline sales capture and sync',
            'M-Pesa statement import',
            'Upgrade anytime before trial ends',
        ],
        limits: {
            maxProducts: 50,
            maxSalesChannels: 3,
            monthlyForecastRuns: 30,
            competitorChecksPerMonth: 20,
            maxTeamMembers: 1,
        },
    },
    starter: {
        tier: 'starter',
        displayName: 'Starter',
        monthlyPriceKes: 1500,
        annualDiscountPercent: 15,
        recommendedFor: ['small_trader'],
        features: [
            'Sales and inventory dashboard',
            'Demand forecasting and low-stock alerts',
            'CSV + manual sales entry',
            'Email support',
        ],
        limits: {
            maxProducts: 100,
            maxSalesChannels: 5,
            monthlyForecastRuns: 120,
            competitorChecksPerMonth: 50,
            maxTeamMembers: 2,
        },
    },
    growth: {
        tier: 'growth',
        displayName: 'Growth',
        monthlyPriceKes: 4500,
        annualDiscountPercent: 18,
        recommendedFor: ['ecommerce'],
        features: [
            'Everything in Starter',
            'Competitor tracking and price intelligence',
            'Advanced channel performance analytics',
            'Priority support',
        ],
        limits: {
            maxProducts: 500,
            maxSalesChannels: 12,
            monthlyForecastRuns: 500,
            competitorChecksPerMonth: 300,
            maxTeamMembers: 5,
        },
    },
    pro: {
        tier: 'pro',
        displayName: 'Pro',
        monthlyPriceKes: 12000,
        annualDiscountPercent: 20,
        recommendedFor: ['wholesaler'],
        features: [
            'Everything in Growth',
            'Higher limits for products and channels',
            'Bulk import and enterprise-ready exports',
            'Dedicated onboarding support',
        ],
        limits: {
            maxProducts: 2500,
            maxSalesChannels: 25,
            monthlyForecastRuns: 2500,
            competitorChecksPerMonth: 1500,
            maxTeamMembers: 15,
        },
    },
};
exports.DEFAULT_SUBSCRIPTION_BY_SELLER_TYPE = {
    small_trader: 'starter',
    ecommerce: 'growth',
    wholesaler: 'pro',
};
function getDefaultSubscriptionTier(sellerType) {
    return exports.DEFAULT_SUBSCRIPTION_BY_SELLER_TYPE[sellerType];
}
//# sourceMappingURL=pricing.js.map