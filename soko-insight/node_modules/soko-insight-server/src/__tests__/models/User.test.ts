import { UserModel, toPublicUser } from '../../models/User';
import { createTestUser, executeTestQuery } from '../helpers/testHelpers';
import { getTestPool } from '../setup';

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

describe('UserModel', () => {
  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
        businessName: 'New Business',
        phone: '+254712345678',
        sellerType: 'small_trader' as const,
      };

      const user = await UserModel.create(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.businessName).toBe(userData.businessName);
      expect(user.phone).toBe(userData.phone);
      expect(user.sellerType).toBe(userData.sellerType);
      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe(userData.password);
      expect(user.subscriptionTier).toBe('starter');
      expect(user.languagePreference).toBe('en');
      expect(user.isActive).toBe(true);
      expect(user.isVerified).toBe(false);
    });

    it('should create user without phone if not provided', async () => {
      const userData = {
        email: 'nophone@example.com',
        password: 'SecurePass123',
        businessName: 'No Phone Business',
        sellerType: 'ecommerce' as const,
      };

      const user = await UserModel.create(userData);

      expect(user.phone).toBeNull();
    });

    it('should hash password correctly', async () => {
      const password = 'TestPassword123';
      const user = await UserModel.create({
        email: 'hashtest@example.com',
        password,
        businessName: 'Hash Test',
        sellerType: 'wholesaler' as const,
      });

      // Password should be hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const testUser = await createTestUser();
      const foundUser = await UserModel.findById(testUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(testUser.id);
      expect(foundUser?.email).toBe(testUser.email);
    });

    it('should return null for non-existent user', async () => {
      const foundUser = await UserModel.findById('00000000-0000-0000-0000-000000000000');
      expect(foundUser).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const testUser = await createTestUser({ email: 'findme@example.com' });
      const foundUser = await UserModel.findByEmail('findme@example.com');

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(testUser.id);
      expect(foundUser?.email).toBe('findme@example.com');
    });

    it('should return null for non-existent email', async () => {
      const foundUser = await UserModel.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user profile fields', async () => {
      const testUser = await createTestUser();
      
      const updatedUser = await UserModel.update(testUser.id, {
        businessName: 'Updated Business Name',
        phone: '+254798765432',
        languagePreference: 'sw',
        emailNotifications: false,
        smsNotifications: true,
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.businessName).toBe('Updated Business Name');
      expect(updatedUser?.phone).toBe('+254798765432');
      expect(updatedUser?.languagePreference).toBe('sw');
      expect(updatedUser?.emailNotifications).toBe(false);
      expect(updatedUser?.smsNotifications).toBe(true);
    });

    it('should update only provided fields', async () => {
      const testUser = await createTestUser();
      
      const updatedUser = await UserModel.update(testUser.id, {
        businessName: 'Partial Update',
      });

      expect(updatedUser?.businessName).toBe('Partial Update');
      expect(updatedUser?.email).toBe(testUser.email); // Should remain unchanged
    });

    it('should return null for non-existent user', async () => {
      const updatedUser = await UserModel.update('00000000-0000-0000-0000-000000000000', {
        businessName: 'Test',
      });

      expect(updatedUser).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const testUser = await createTestUser();
      const newPassword = 'NewSecurePass123';

      const result = await UserModel.updatePassword(testUser.id, newPassword);
      expect(result).toBe(true);

      // Verify new password works
      const updatedUser = await UserModel.findById(testUser.id);
      const isValid = await UserModel.verifyPassword(updatedUser!, newPassword);
      expect(isValid).toBe(true);
    });

    it('should return false for non-existent user', async () => {
      const result = await UserModel.updatePassword('00000000-0000-0000-0000-000000000000', 'NewPass123');
      expect(result).toBe(false);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'CorrectPassword123';
      const testUser = await createTestUser({ password });
      const user = await UserModel.findById(testUser.id);
      
      expect(user).not.toBeNull();
      const isValid = await UserModel.verifyPassword(user!, password);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const testUser = await createTestUser({ password: 'CorrectPassword123' });
      const user = await UserModel.findById(testUser.id);
      
      expect(user).not.toBeNull();
      const isValid = await UserModel.verifyPassword(user!, 'WrongPassword123');
      expect(isValid).toBe(false);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const testUser = await createTestUser();
      
      await UserModel.updateLastLogin(testUser.id);
      
      const updatedUser = await UserModel.findById(testUser.id);
      expect(updatedUser?.lastLogin).toBeDefined();
      expect(updatedUser?.lastLogin).not.toBeNull();
    });
  });

  describe('deactivate', () => {
    it('should deactivate user account', async () => {
      const testUser = await createTestUser();
      
      const result = await UserModel.deactivate(testUser.id);
      expect(result).toBe(true);

      const deactivatedUser = await UserModel.findById(testUser.id);
      expect(deactivatedUser?.isActive).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      const result = await UserModel.deactivate('00000000-0000-0000-0000-000000000000');
      expect(result).toBe(false);
    });
  });

  describe('countBySellerType', () => {
    it('should count users by seller type', async () => {
      await createTestUser({ sellerType: 'small_trader' });
      await createTestUser({ sellerType: 'small_trader' });
      await createTestUser({ sellerType: 'ecommerce' });
      await createTestUser({ sellerType: 'wholesaler' });

      const counts = await UserModel.countBySellerType();

      expect(counts.small_trader).toBe(2);
      expect(counts.ecommerce).toBe(1);
      expect(counts.wholesaler).toBe(1);
    });
  });

  describe('toPublicUser', () => {
    it('should return user without password hash', async () => {
      const testUser = await createTestUser();
      const user = await UserModel.findById(testUser.id);
      
      expect(user).not.toBeNull();
      const publicUser = toPublicUser(user!);

      expect(publicUser.id).toBe(testUser.id);
      expect(publicUser.email).toBe(testUser.email);
      expect(publicUser.businessName).toBe(testUser.businessName);
      expect((publicUser as any).passwordHash).toBeUndefined();
    });
  });
});

