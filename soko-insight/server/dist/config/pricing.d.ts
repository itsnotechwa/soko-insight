export type SellerType = 'small_trader' | 'ecommerce' | 'wholesaler';
export type SubscriptionTier = 'trial' | 'starter' | 'growth' | 'pro';
export interface PlanLimits {
    maxProducts: number;
    maxSalesChannels: number;
    monthlyForecastRuns: number;
    competitorChecksPerMonth: number;
    maxTeamMembers: number;
}
export interface PricingPlan {
    tier: SubscriptionTier;
    displayName: string;
    monthlyPriceKes: number;
    annualDiscountPercent: number;
    trialDays?: number;
    recommendedFor: SellerType[];
    features: string[];
    limits: PlanLimits;
}
export declare const PRICING_PLANS: Record<SubscriptionTier, PricingPlan>;
export declare const DEFAULT_SUBSCRIPTION_BY_SELLER_TYPE: Record<SellerType, SubscriptionTier>;
export declare function getDefaultSubscriptionTier(sellerType: SellerType): SubscriptionTier;
//# sourceMappingURL=pricing.d.ts.map