export interface Competitor {
    id: string;
    userId: string;
    name: string;
    platform: string | null;
    website: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CompetitorPrice {
    id: string;
    productId: string;
    competitorId: string;
    price: number;
    recordedAt: Date;
}
export interface CreateCompetitorInput {
    userId: string;
    name: string;
    platform?: string;
    website?: string;
    notes?: string;
}
export interface UpdateCompetitorInput {
    name?: string;
    platform?: string;
    website?: string;
    notes?: string;
    isActive?: boolean;
}
export interface CreateCompetitorPriceInput {
    productId: string;
    competitorId: string;
    price: number;
}
export declare class CompetitorModel {
    static findById(id: string, userId?: string): Promise<Competitor | null>;
    static findByUserId(userId: string, options?: {
        page?: number;
        limit?: number;
        search?: string;
        platform?: string;
        isActive?: boolean;
    }): Promise<{
        competitors: Competitor[];
        total: number;
    }>;
    static create(input: CreateCompetitorInput): Promise<Competitor>;
    static update(id: string, userId: string, input: UpdateCompetitorInput): Promise<Competitor | null>;
    static delete(id: string, userId: string): Promise<boolean>;
}
export declare class CompetitorPriceModel {
    static create(input: CreateCompetitorPriceInput): Promise<CompetitorPrice>;
    static getLatestPrices(productId: string): Promise<Array<CompetitorPrice & {
        competitorName: string;
        platform: string | null;
    }>>;
    static getPriceHistory(productId: string, competitorId: string, days?: number): Promise<CompetitorPrice[]>;
    static getPriceComparison(productId: string, userPrice: number): Promise<{
        yourPrice: number;
        competitors: Array<{
            competitorId: string;
            competitorName: string;
            platform: string | null;
            price: number;
            difference: number;
            differencePercent: number;
        }>;
        averageCompetitorPrice: number;
        minPrice: number;
        maxPrice: number;
        pricePosition: 'lowest' | 'highest' | 'average' | 'middle';
    }>;
}
//# sourceMappingURL=Competitor.d.ts.map