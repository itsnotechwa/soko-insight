export interface Notification {
    id: string;
    userId: string;
    type: 'info' | 'warning' | 'alert' | 'success';
    category: 'stock' | 'sales' | 'trend' | 'competitor' | 'system';
    title: string;
    message: string;
    isRead: boolean;
    sentEmail: boolean;
    sentSms: boolean;
    createdAt: Date;
}
export interface CreateNotificationInput {
    userId: string;
    type: 'info' | 'warning' | 'alert' | 'success';
    category: 'stock' | 'sales' | 'trend' | 'competitor' | 'system';
    title: string;
    message: string;
}
export declare class NotificationModel {
    static findById(id: string, userId?: string): Promise<Notification | null>;
    static findByUserId(userId: string, options?: {
        page?: number;
        limit?: number;
        isRead?: boolean;
        category?: string;
        type?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        notifications: Notification[];
        total: number;
    }>;
    static create(input: CreateNotificationInput): Promise<Notification>;
    static markAsRead(id: string, userId: string): Promise<Notification | null>;
    static markAllAsRead(userId: string): Promise<number>;
    static markEmailSent(id: string): Promise<void>;
    static markSmsSent(id: string): Promise<void>;
    static getUnreadCount(userId: string): Promise<number>;
    static delete(id: string, userId: string): Promise<boolean>;
    static deleteOld(olderThanDays?: number): Promise<number>;
}
//# sourceMappingURL=Notification.d.ts.map