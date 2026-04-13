"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../../middleware/auth");
const setup_1 = require("../setup");
const testHelpers_1 = require("../helpers/testHelpers");
const User_1 = require("../../models/User");
// Mock the database query function to use test database
jest.mock('../../config/database', () => {
    const originalModule = jest.requireActual('../../config/database');
    return {
        ...originalModule,
        query: jest.fn(async (text, params) => {
            const pool = (0, setup_1.getTestPool)();
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
    let mockRequest;
    let mockResponse;
    let nextFunction;
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
            const testUser = await (0, testHelpers_1.createTestUser)();
            const token = (0, auth_1.generateToken)({
                id: testUser.id,
                email: testUser.email,
                businessName: testUser.businessName,
                sellerType: testUser.sellerType,
                subscriptionTier: 'free',
            });
            mockRequest.headers = {
                authorization: `Bearer ${token}`,
            };
            await (0, auth_1.authenticate)(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.user).toBeDefined();
            expect(mockRequest.user?.id).toBe(testUser.id);
            expect(mockRequest.user?.email).toBe(testUser.email);
            expect(nextFunction).toHaveBeenCalled();
        });
        it('should reject request without token', async () => {
            mockRequest.headers = {};
            await (0, auth_1.authenticate)(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.user).toBeUndefined();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should reject request with invalid token format', async () => {
            mockRequest.headers = {
                authorization: 'InvalidFormat token',
            };
            await (0, auth_1.authenticate)(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.user).toBeUndefined();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should reject expired token', async () => {
            const expiredToken = jsonwebtoken_1.default.sign({ id: 'test-id', email: 'test@example.com' }, 'test-secret-key', { expiresIn: '-1h' });
            mockRequest.headers = {
                authorization: `Bearer ${expiredToken}`,
            };
            await (0, auth_1.authenticate)(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.user).toBeUndefined();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should reject token for non-existent user', async () => {
            const token = jsonwebtoken_1.default.sign({ id: '00000000-0000-0000-0000-000000000000', email: 'nonexistent@example.com' }, 'test-secret-key', { expiresIn: '7d' });
            mockRequest.headers = {
                authorization: `Bearer ${token}`,
            };
            await (0, auth_1.authenticate)(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.user).toBeUndefined();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should reject token for deactivated user', async () => {
            const testUser = await (0, testHelpers_1.createTestUser)();
            await User_1.UserModel.deactivate(testUser.id);
            const token = (0, auth_1.generateToken)({
                id: testUser.id,
                email: testUser.email,
                businessName: testUser.businessName,
                sellerType: testUser.sellerType,
                subscriptionTier: 'free',
            });
            mockRequest.headers = {
                authorization: `Bearer ${token}`,
            };
            await (0, auth_1.authenticate)(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.user).toBeUndefined();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });
    describe('optionalAuth', () => {
        it('should attach user if valid token provided', async () => {
            const testUser = await (0, testHelpers_1.createTestUser)();
            const token = (0, auth_1.generateToken)({
                id: testUser.id,
                email: testUser.email,
                businessName: testUser.businessName,
                sellerType: testUser.sellerType,
                subscriptionTier: 'free',
            });
            mockRequest.headers = {
                authorization: `Bearer ${token}`,
            };
            await (0, auth_1.optionalAuth)(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.user).toBeDefined();
            expect(mockRequest.user?.id).toBe(testUser.id);
            expect(nextFunction).toHaveBeenCalled();
        });
        it('should continue without user if no token provided', async () => {
            mockRequest.headers = {};
            await (0, auth_1.optionalAuth)(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.user).toBeUndefined();
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should continue without user if invalid token provided', async () => {
            mockRequest.headers = {
                authorization: 'Bearer invalid-token',
            };
            await (0, auth_1.optionalAuth)(mockRequest, mockResponse, nextFunction);
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
            const middleware = (0, auth_1.requireSellerType)('small_trader', 'ecommerce');
            middleware(mockRequest, mockResponse, nextFunction);
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
            const middleware = (0, auth_1.requireSellerType)('ecommerce', 'wholesaler');
            middleware(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });
        it('should reject if user not authenticated', () => {
            mockRequest.user = undefined;
            const middleware = (0, auth_1.requireSellerType)('small_trader');
            middleware(mockRequest, mockResponse, nextFunction);
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
            const middleware = (0, auth_1.requireSubscription)('pro', 'enterprise');
            middleware(mockRequest, mockResponse, nextFunction);
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
            const middleware = (0, auth_1.requireSubscription)('pro', 'enterprise');
            middleware(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });
        it('should reject if user not authenticated', () => {
            mockRequest.user = undefined;
            const middleware = (0, auth_1.requireSubscription)('pro');
            middleware(mockRequest, mockResponse, nextFunction);
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
            const token = (0, auth_1.generateToken)(user);
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            // Verify token can be decoded
            const decoded = jsonwebtoken_1.default.verify(token, 'test-secret-key');
            expect(decoded.id).toBe(user.id);
            expect(decoded.email).toBe(user.email);
        });
    });
});
//# sourceMappingURL=auth.test.js.map