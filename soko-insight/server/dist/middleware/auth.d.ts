import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                businessName: string;
                sellerType: string;
                subscriptionTier: string;
            };
        }
    }
}
export declare function authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function requireSellerType(...allowedTypes: string[]): (req: Request, res: Response, next: NextFunction) => void;
export declare function requireSubscription(...allowedTiers: string[]): (req: Request, res: Response, next: NextFunction) => void;
export declare function generateToken(user: {
    id: string;
    email: string;
    businessName: string;
    sellerType: string;
    subscriptionTier: string;
}): string;
//# sourceMappingURL=auth.d.ts.map