import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, optionalAuth, requireSellerType, requireSubscription, generateToken } from '../../middleware/auth';
import { getTestPool } from '../setup';
import { createTestUser } from '../helpers/testHelpers';
import { UserModel } from '../../models/User';

// Mock the database query function to use test database
jest.mock('../../config/database', () => {
  const originalModule = jest.requireActual('../../config/database');
  return {
    ...originalModule,
    query: jest.fn(async (text: string, params?: any[]) => {
      const pool = getTestPool();
      const result = await pool.query(text, params);
      return { rows: result.rows, rowCount: result.rowCount || 0 };
    }),
  };
});

// Mock config
jest.mock('../../config', () => ({
  config: {
    jwt: {
      secret: 'test-secret-key',
      expiresIn: '7d',
    },
    database: {
      url: '',
      host: 'localhost',
      port: 5432,
      name: 'soko_insight_test',
      user: 'postgres',
      password: 'password',
    },
    nodeEnv: 'test',
  },
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('authenticate', () => {
    it('should authenticate valid token and attach user to request', async () => {
      const testUser = await createTestUser();
      const token = generateToken({
        id: testUser.id,
        email: testUser.email,
        businessName: testUser.businessName,
        sellerType: testUser.sellerType,
        subscriptionTier: 'free',
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe(testUser.id);
      expect(mockRequest.user?.email).toBe(testUser.email);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      mockRequest.headers = {};

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { id: 'test-id', email: 'test@example.com' },
        'test-secret-key',
        { expiresIn: '-1h' }
      );

      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject token for non-existent user', async () => {
      const token = jwt.sign(
        { id: '00000000-0000-0000-0000-000000000000', email: 'nonexistent@example.com' },
        'test-secret-key',
        { expiresIn: '7d' }
      );

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject token for deactivated user', async () => {
      const testUser = await createTestUser();
      await UserModel.deactivate(testUser.id);

      const token = generateToken({
        id: testUser.id,
        email: testUser.email,
        businessName: testUser.businessName,
        sellerType: testUser.sellerType,
        subscriptionTier: 'free',
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should attach user if valid token provided', async () => {
      const testUser = await createTestUser();
      const token = generateToken({
        id: testUser.id,
        email: testUser.email,
        businessName: testUser.businessName,
        sellerType: testUser.sellerType,
        subscriptionTier: 'free',
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      await optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe(testUser.id);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should continue without user if no token provided', async () => {
      mockRequest.headers = {};

      await optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without user if invalid token provided', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      await optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('requireSellerType', () => {
    it('should allow access for correct seller type', () => {
      mockRequest.user = {
        id: 'test-id',
        email: 'test@example.com',
        businessName: 'Test',
        sellerType: 'small_trader',
        subscriptionTier: 'free',
      };

      const middleware = requireSellerType('small_trader', 'ecommerce');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject access for incorrect seller type', () => {
      mockRequest.user = {
        id: 'test-id',
        email: 'test@example.com',
        businessName: 'Test',
        sellerType: 'small_trader',
        subscriptionTier: 'free',
      };

      const middleware = requireSellerType('ecommerce', 'wholesaler');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should reject if user not authenticated', () => {
      mockRequest.user = undefined;

      const middleware = requireSellerType('small_trader');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireSubscription', () => {
    it('should allow access for correct subscription tier', () => {
      mockRequest.user = {
        id: 'test-id',
        email: 'test@example.com',
        businessName: 'Test',
        sellerType: 'small_trader',
        subscriptionTier: 'pro',
      };

      const middleware = requireSubscription('pro', 'enterprise');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject access for insufficient subscription tier', () => {
      mockRequest.user = {
        id: 'test-id',
        email: 'test@example.com',
        businessName: 'Test',
        sellerType: 'small_trader',
        subscriptionTier: 'free',
      };

      const middleware = requireSubscription('pro', 'enterprise');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should reject if user not authenticated', () => {
      mockRequest.user = undefined;

      const middleware = requireSubscription('pro');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const user = {
        id: 'test-id',
        email: 'test@example.com',
        businessName: 'Test Business',
        sellerType: 'small_trader',
        subscriptionTier: 'free',
      };

      const token = generateToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token can be decoded
      const decoded = jwt.verify(token, 'test-secret-key') as any;
      expect(decoded.id).toBe(user.id);
      expect(decoded.email).toBe(user.email);
    });
  });
});


