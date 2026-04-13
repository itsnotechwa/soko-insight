export interface SalesChannel {
    id: string;
    userId: string;
    channelName: string;
    channelType: 'online' | 'offline' | 'mpesa';
    platform: string | null;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateSalesChannelInput {
    userId: string;
    channelName: string;
    channelType: 'online' | 'offline' | 'mpesa';
    platform?: string;
    description?: string;
}
export interface UpdateSalesChannelInput {
    channelName?: string;
    channelType?: 'online' | 'offline' | 'mpesa';
    platform?: string;
    description?: string;
    isActive?: boolean;
}
export declare class SalesChannelModel {
    static findById(id: string, userId?: string): Promise<SalesChannel | null>;
    static findByUserId(userId: string, includeInactive?: boolean): Promise<SalesChannel[]>;
    static create(input: CreateSalesChannelInput): Promise<SalesChannel>;
    static update(id: string, userId: string, input: UpdateSalesChannelInput): Promise<SalesChannel | null>;
    static delete(id: string, userId: string): Promise<boolean>;
    static countByUser(userId: string): Promise<number>;
    static createDefaults(userId: string, sellerType: string): Promise<SalesChannel[]>;
}
//# sourceMappingURL=SalesChannel.d.ts.map