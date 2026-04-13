export interface SmsOptions {
    to: string;
    message: string;
}
export declare class SmsService {
    static sendSms(options: SmsOptions): Promise<boolean>;
    static sendNotificationSms(to: string, notification: {
        title: string;
        message: string;
    }): Promise<boolean>;
    static sendLowStockAlert(to: string, productName: string, currentStock: number, reorderLevel: number): Promise<boolean>;
    static sendSalesMilestone(to: string, milestone: string, amount: number): Promise<boolean>;
}
//# sourceMappingURL=smsService.d.ts.map