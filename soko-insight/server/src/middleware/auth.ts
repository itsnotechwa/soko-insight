import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { sendUnauthorized, sendForbidden } from '../utils/response';
import { query } from '../config/database';

// Extend Express Request type to include user
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

interface JwtPayload {
  id: string;
  email: string;
  businessName: string;
  sellerType: string;
  subscriptionTier: string;
  iat: number;
  exp: number;
}

// Authentication middleware
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No token provided');
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    // Check if user still exists and is active
    const { rows } = await query(
      'SELECT id, email, business_name, seller_type, subscription_tier, is_active FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (rows.length === 0) {
      sendUnauthorized(res, 'User not found');
      return;
    }
    
    const user = rows[0];
    
    if (!user.is_active) {
      sendForbidden(res, 'Account is deactivated');
      return;
    }
    
    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      businessName: user.business_name,
      sellerType: user.seller_type,
      subscriptionTier: user.subscription_tier,
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendUnauthorized(res, 'Token expired');
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      sendUnauthorized(res, 'Invalid token');
      return;
    }
    console.error('Auth middleware error:', error);
    sendUnauthorized(res, 'Authentication failed');
  }
}

// Optional authentication (doesn't fail if no token)
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    const { rows } = await query(
      'SELECT id, email, business_name, seller_type, subscription_tier FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    );
    
    if (rows.length > 0) {
      const user = rows[0];
      req.user = {
        id: user.id,
        email: user.email,
        businessName: user.business_name,
        sellerType: user.seller_type,
        subscriptionTier: user.subscription_tier,
      };
    }
    
    next();
  } catch {
    // Ignore errors for optional auth
    next();
  }
}

// Seller type restriction middleware
export function requireSellerType(...allowedTypes: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }
    
    if (!allowedTypes.includes(req.user.sellerType)) {
      sendForbidden(res, 'This feature is not available for your seller type');
      return;
    }
    
    next();
  };
}

// Subscription tier restriction middleware
export function requireSubscription(...allowedTiers: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }
    
    if (!allowedTiers.includes(req.user.subscriptionTier)) {
      sendForbidden(res, 'This feature requires a higher subscription tier');
      return;
    }
    
    next();
  };
}

// Generate JWT token
export function generateToken(user: {
  id: string;
  email: string;
  businessName: string;
  sellerType: string;
  subscriptionTier: string;
}): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      businessName: user.businessName,
      sellerType: user.sellerType,
      subscriptionTier: user.subscriptionTier,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as SignOptions
  );
}

