export interface Recommendation {
    type: 'info' | 'warning' | 'alert' | 'success';
    category: 'stock' | 'sales' | 'trend' | 'competitor' | 'system';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    actionUrl?: string;
    actionText?: string;
}
export declare class RecommendationsService {
    static generateRecommendations(userId: string): Promise<Recommendation[]>;
    static createNotificationsFromRecommendations(userId: string, recommendations: Recommendation[]): Promise<void>;
    static generateAndSaveRecommendations(userId: string): Promise<Recommendation[]>;
}
//# sourceMappingURL=recommendationsService.d.ts.map