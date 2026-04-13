import { validateRegister, validateLogin, validateUpdateProfile, validateEmail, validatePassword, validatePhone } from '../../utils/validation';
import { validationResult } from 'express-validator';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should accept valid email', async () => {
      const req: any = {
        body: { email: 'test@example.com' },
      };
      
      await validateEmail(req, {} as any, () => {});

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should reject invalid email', async () => {
      const req: any = {
        body: { email: 'invalid-email' },
      };
      
      await validateEmail(req, {} as any, () => {});

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept valid password (8+ chars with number)', async () => {
      const req: any = {
        body: { password: 'SecurePass123' },
      };
      
      await validatePassword(req, {} as any, () => {});

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should reject short password', async () => {
      const req: any = {
        body: { password: 'Short1' },
      };
      
      await validatePassword(req, {} as any, () => {});

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should reject password without number', async () => {
      const req: any = {
        body: { password: 'NoNumbers' },
      };
      
      await validatePassword(req, {} as any, () => {});

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should accept valid Kenyan phone number', async () => {
      const validNumbers = ['+254712345678', '0712345678', '+254798765432'];
      
      for (const phone of validNumbers) {
        const req: any = {
          body: { phone },
        };
        
        await validatePhone(req, {} as any, () => {});

        const errors = validationResult(req);
        expect(errors.isEmpty()).toBe(true);
      }
    });

    it('should reject invalid phone number', async () => {
      const req: any = {
        body: { phone: '123456789' },
      };
      
      await validatePhone(req, {} as any, () => {});

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });

    it('should accept empty phone (optional)', async () => {
      const req: any = {
        body: {},
      };
      
      await validatePhone(req, {} as any, () => {});

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });
  });

  describe('validateRegister', () => {
    it('should accept valid registration data', async () => {
      const req: any = {
        body: {
          email: 'newuser@example.com',
          password: 'SecurePass123',
          businessName: 'New Business',
          sellerType: 'small_trader',
          phone: '+254712345678',
        },
      };
      
      for (const validator of validateRegister) {
        await validator(req, {} as any, () => {});
      }

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should reject invalid seller type', async () => {
      const req: any = {
        body: {
          email: 'test@example.com',
          password: 'SecurePass123',
          businessName: 'Test Business',
          sellerType: 'invalid_type',
        },
      };
      
      for (const validator of validateRegister) {
        await validator(req, {} as any, () => {});
      }

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });
  });

  describe('validateLogin', () => {
    it('should accept valid login data', async () => {
      const req: any = {
        body: {
          email: 'user@example.com',
          password: 'AnyPassword123',
        },
      };
      
      for (const validator of validateLogin) {
        await validator(req, {} as any, () => {});
      }

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should reject missing password', async () => {
      const req: any = {
        body: {
          email: 'user@example.com',
        },
      };
      
      for (const validator of validateLogin) {
        await validator(req, {} as any, () => {});
      }

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });
  });

  describe('validateUpdateProfile', () => {
    it('should accept valid profile update', async () => {
      const req: any = {
        body: {
          businessName: 'Updated Business',
          phone: '+254798765432',
          languagePreference: 'sw',
          emailNotifications: false,
          smsNotifications: true,
        },
      };
      
      for (const validator of validateUpdateProfile) {
        await validator(req, {} as any, () => {});
      }

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should accept partial update', async () => {
      const req: any = {
        body: {
          businessName: 'Partial Update',
        },
      };
      
      for (const validator of validateUpdateProfile) {
        await validator(req, {} as any, () => {});
      }

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should reject invalid language preference', async () => {
      const req: any = {
        body: {
          languagePreference: 'fr',
        },
      };
      
      for (const validator of validateUpdateProfile) {
        await validator(req, {} as any, () => {});
      }

      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
    });
  });
});


