export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare class EmailService {
    private static transporter;
    static initialize(): void;
    static sendEmail(options: EmailOptions): Promise<boolean>;
    static sendNotificationEmail(to: string, notification: {
        title: string;
        message: string;
        type: 'info' | 'warning' | 'alert' | 'success';
    }): Promise<boolean>;
    static sendDigest(to: string, businessName: string, summary: {
        totalRevenue: number;
        totalOrders: number;
        totalProfit: number;
        period: string;
    }): Promise<boolean>;
}
//# sourceMappingURL=emailService.d.ts.map