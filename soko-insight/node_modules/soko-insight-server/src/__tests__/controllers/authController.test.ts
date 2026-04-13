import request from 'supertest';
import express from 'express';
import { getTestPool } from '../setup';
import { createTestUser, getAuthHeader } from '../helpers/testHelpers';
import { UserModel } from '../../models/User';
import { SalesChannelModel } from '../../models/SalesChannel';

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

// Import routes after mocking
import authRoutes from '../../routes/authRoutes';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller', () => {
  describe('GET /api/auth/plans', () => {
    it('should return public pricing plans', async () => {
      const response = await request(app)
        .get('/api/auth/plans')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currency).toBe('KES');
      expect(Array.isArray(response.body.data.plans)).toBe(true);
      expect(response.body.data.plans.length).toBeGreaterThan(0);

      const planTiers = response.body.data.plans.map((plan: any) => plan.tier);
      expect(planTiers).toEqual(expect.arrayContaining(['trial', 'starter', 'growth', 'pro']));
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
        businessName: 'New Business',
        phone: '+254712345678',
        sellerType: 'small_trader',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.businessName).toBe(userData.businessName);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should create default sales channels for small_trader', async () => {
      const userData = {
        email: 'trader@example.com',
        password: 'SecurePass123',
        businessName: 'Trader Business',
        sellerType: 'small_trader',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = response.body.data.user.id;
      const channels = await SalesChannelModel.findByUserId(userId);
      
      expect(channels.length).toBeGreaterThan(0);
      expect(channels.some(c => c.channelName === 'My Shop')).toBe(true);
    });

    it('should create default sales channels for ecommerce seller', async () => {
      const userData = {
        email: 'ecommerce@example.com',
        password: 'SecurePass123',
        businessName: 'E-commerce Business',
        sellerType: 'ecommerce',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = response.body.data.user.id;
      const channels = await SalesChannelModel.findByUserId(userId);
      
      expect(channels.length).toBe(2);
      expect(channels.some(c => c.channelName === 'Jumia')).toBe(true);
      expect(channels.some(c => c.channelName === 'Offline Sales')).toBe(true);
    });

    it('should reject duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123',
        businessName: 'First Business',
        sellerType: 'small_trader',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register again with same email
      await request(app)
        .post('/api/auth/register')
        .send({ ...userData, businessName: 'Second Business' })
        .expect(409);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'short',
        })
        .expect(422); // 422 Unprocessable Entity is correct for validation errors

      expect(response.body.success).toBe(false);
    });

    it('should validate seller type', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123',
          businessName: 'Test Business',
          sellerType: 'invalid_type',
        })
        .expect(422); // 422 Unprocessable Entity is correct for validation errors

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const testUser = await createTestUser({
        email: 'login@example.com',
        password: 'LoginPass123',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'LoginPass123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('login@example.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject incorrect password', async () => {
      await createTestUser({
        email: 'wrongpass@example.com',
        password: 'CorrectPass123',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'WrongPass123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPass123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject login for deactivated account', async () => {
      const testUser = await createTestUser({
        email: 'deactivated@example.com',
        password: 'Pass123456',
      });

      await UserModel.deactivate(testUser.id);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'deactivated@example.com',
          password: 'Pass123456',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const testUser = await createTestUser();

      const response = await request(app)
        .get('/api/auth/me')
        .set(getAuthHeader(testUser.token!))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.email).toBe(testUser.email);
    });

    it('should reject request without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set({ Authorization: 'Bearer invalid-token' })
        .expect(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile', async () => {
      const testUser = await createTestUser();

      const response = await request(app)
        .put('/api/auth/profile')
        .set(getAuthHeader(testUser.token!))
        .send({
          businessName: 'Updated Business Name',
          phone: '+254798765432',
          languagePreference: 'sw',
          emailNotifications: false,
          smsNotifications: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.businessName).toBe('Updated Business Name');
      expect(response.body.data.phone).toBe('+254798765432');
      expect(response.body.data.languagePreference).toBe('sw');
      expect(response.body.data.emailNotifications).toBe(false);
      expect(response.body.data.smsNotifications).toBe(true);
    });

    it('should update only provided fields', async () => {
      const testUser = await createTestUser();

      const response = await request(app)
        .put('/api/auth/profile')
        .set(getAuthHeader(testUser.token!))
        .send({
          businessName: 'Partial Update',
        })
        .expect(200);

      expect(response.body.data.businessName).toBe('Partial Update');
      expect(response.body.data.email).toBe(testUser.email); // Should remain unchanged
    });

    it('should require authentication', async () => {
      await request(app)
        .put('/api/auth/profile')
        .send({ businessName: 'Test' })
        .expect(401);
    });
  });

  describe('PUT /api/auth/subscription', () => {
    it('should update subscription tier for authenticated user', async () => {
      const testUser = await createTestUser();

      const response = await request(app)
        .put('/api/auth/subscription')
        .set(getAuthHeader(testUser.token!))
        .send({ subscriptionTier: 'growth' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.subscriptionTier).toBe('growth');
      expect(response.body.data.token).toBeDefined();
    });

    it('should validate subscription tier input', async () => {
      const testUser = await createTestUser();

      await request(app)
        .put('/api/auth/subscription')
        .set(getAuthHeader(testUser.token!))
        .send({ subscriptionTier: 'invalid-tier' })
        .expect(422);
    });
  });

  describe('PUT /api/auth/change-password', () => {
    it('should change password with correct current password', async () => {
      const testUser = await createTestUser({ password: 'OldPass123' });

      const response = await request(app)
        .put('/api/auth/change-password')
        .set(getAuthHeader(testUser.token!))
        .send({
          currentPassword: 'OldPass123',
          newPassword: 'NewSecurePass123', // Ensure it meets password requirements
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'NewSecurePass123', // Use the new password that was set
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should reject incorrect current password', async () => {
      const testUser = await createTestUser({ password: 'OldPass123' });

      const response = await request(app)
        .put('/api/auth/change-password')
        .set(getAuthHeader(testUser.token!))
        .send({
          currentPassword: 'WrongPass123',
          newPassword: 'NewSecurePass123', // Ensure it meets password requirements
        })
        .expect(400); // API returns 400 for incorrect current password (business logic error)

      expect(response.body.success).toBe(false);
    });

    it('should reject if new password is same as current', async () => {
      const testUser = await createTestUser({ password: 'SamePass123' });

      const response = await request(app)
        .put('/api/auth/change-password')
        .set(getAuthHeader(testUser.token!))
        .send({
          currentPassword: 'SamePass123',
          newPassword: 'SamePass123',
        })
        .expect(422); // API returns 422 for validation/business logic errors

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/deactivate', () => {
    it('should deactivate account with correct password', async () => {
      const testUser = await createTestUser({ password: 'DeactivatePass123' });

      const response = await request(app)
        .post('/api/auth/deactivate')
        .set(getAuthHeader(testUser.token!))
        .send({
          password: 'DeactivatePass123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify account is deactivated
      const user = await UserModel.findById(testUser.id);
      expect(user?.isActive).toBe(false);
    });

    it('should reject deactivation with incorrect password', async () => {
      const testUser = await createTestUser({ password: 'CorrectPass123' });

      const response = await request(app)
        .post('/api/auth/deactivate')
        .set(getAuthHeader(testUser.token!))
        .send({
          password: 'WrongPass123',
        })
        .expect(400); // API returns 400 for incorrect password (business logic error)

      expect(response.body.success).toBe(false);
    });
  });
});


