import { SubscriptionTier } from '../config/pricing';
export interface User {
    id: string;
    email: string;
    passwordHash: string;
    businessName: string;
    phone: string | null;
    sellerType: 'small_trader' | 'ecommerce' | 'wholesaler';
    subscriptionTier: SubscriptionTier;
    languagePreference: 'en' | 'sw';
    emailNotifications: boolean;
    smsNotifications: boolean;
    isActive: boolean;
    isVerified: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateUserInput {
    email: string;
    password: string;
    businessName: string;
    phone?: string;
    sellerType: 'small_trader' | 'ecommerce' | 'wholesaler';
}
export interface UpdateUserInput {
    businessName?: string;
    phone?: string;
    languagePreference?: 'en' | 'sw';
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    subscriptionTier?: SubscriptionTier;
}
export interface UserPublic {
    id: string;
    email: string;
    businessName: string;
    phone: string | null;
    sellerType: string;
    subscriptionTier: string;
    languagePreference: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    createdAt: Date;
}
export declare function toPublicUser(user: User): UserPublic;
export declare class UserModel {
    static findById(id: string): Promise<User | null>;
    static findByEmail(email: string): Promise<User | null>;
    static create(input: CreateUserInput): Promise<User>;
    static update(id: string, input: UpdateUserInput): Promise<User | null>;
    static updatePassword(id: string, newPassword: string): Promise<boolean>;
    static verifyPassword(user: User, password: string): Promise<boolean>;
    static updateLastLogin(id: string): Promise<void>;
    static deactivate(id: string): Promise<boolean>;
    static countBySellerType(): Promise<Record<string, number>>;
}
//# sourceMappingURL=User.d.ts.map