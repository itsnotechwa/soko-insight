"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validation_1 = require("../../utils/validation");
const express_validator_1 = require("express-validator");
describe('Validation Utilities', () => {
    describe('validateEmail', () => {
        it('should accept valid email', async () => {
            const req = {
                body: { email: 'test@example.com' },
            };
            await (0, validation_1.validateEmail)(req, {}, () => { });
            const errors = (0, express_validator_1.validationResult)(req);
            expect(errors.isEmpty()).toBe(true);
        });
        it('should reject invalid email', async () => {
            const req = {
                body: { email: 'invalid-email' },
            };
            await (0, validation_1.validateEmail)(req, {}, () => { });
            const errors = (0, express_validator_1.validationResult)(req);
            expect(errors.isEmpty()).toBe(false);
        });
    });
    describe('validatePassword', () => {
        it('should accept valid password (8+ chars with number)', async () => {
            const req = {
                body: { password: 'SecurePass123' },
            };
            await (0, validation_1.validatePassword)(req, {}, () => { });
            const errors = (0, express_validator_1.validationResult)(req);
            expect(errors.isEmpty()).toBe(true);
        });
        it('should reject short password', async () => {
            const req = {
                body: { password: 'Short1' },
            };
            await (0, validation_1.validatePassword)(req, {}, () => { });
            const errors = (0, express_validator_1.validationResult)(req);
            expect(errors.isEmpty()).toBe(false);
        });
        it('should reject password without number', async () => {
            const req = {
                body: { password: 'NoNumbers' },
            };
            await (0, validation_1.validatePassword)(req, {}, () => { });
            const errors = (0, express_validator_1.validationResult)(req);
            expect(errors.isEmpty()).toBe(false);
        });
    });
    describe('validatePhone', () => {
        it('should accept valid Kenyan phone number', async () => {
            const validNumbers = ['+254712345678', '0712345678', '+254798765432'];
            for (const phone of validNumbers) {
                const req = {
                    body: { phone },
                };
                await (0, validation_1.validatePhone)(req, {}, () => { });
                const errors = (0, express_validator_1.validationResult)(req);
                expect(errors.isEmpty()).toBe(true);
            }
        });
        it('should reject invalid phone number', async () => {
            const req = {
                body: { phone: '123456789' },
            };
            await (0, validation_1.validatePhone)(req, {}, () => { });
            const errors = (0, express_validator_1.validationResult)(req);
            expect(errors.isEmpty()).toBe(false);
        });
        it('should accept empty phone (optional)', async () => {
            const req = {
                body: {},
            };
            await (0, validation_1.validatePhone)(req, {}, () => { });
            const errors = (0, express_validator_1.validationResult)(req);
            expect(errors.isEmpty()).toBe(true);
        });
    });
    describe('validateRegister', () => {
        it('should accept valid registration data', async () => {
            const req = {
                body: {
                    email: 'newuser@example.com',
                    password: 'SecurePass123',
                    businessName: 'New Business',
                    sellerType: 'small_trader',
                    phone: '+254712345678',
                },
            };
            for (const validator of validation_1.validateRegister) {
                await validator(req, {}, () => { });
            }
            const errors = (0, express_validator_1.validationResult)(req);
            expect(errors.isEmpty()).toBe(true);
        });
        it('should reject invalid seller type', async () => {
            const req = {
                body: {
                    email: 'test@example.com',
                    password: 'SecurePass123',
                    businessName: 'Test Business',
                    sellerType: 'invalid_type',
                },
            };
            for (const validator of validation_1.validateRegister) {
                await validator(req, {}, () => { });
            }
            const errors = (0, express_validator_1.validationResult)(req);
            expect(errors.isEmpty()).toBe(false);
        });
    });
    describe('validateLogin', () => {
        it('should accept valid login data', async () => {
            const req = {
                body: {
                    email: 'user@example.com',
                    password: 'AnyPassword123',
                },
            };
            for (const validator of validation_1.validateLogin) {
                await validator(req, {}, () => { });
            }
            const errors = (0, express_validator_1.validationResult)(req);
            expect(errors.isEmpty()).toBe(true);
        });
        it('should reject missing password', async () => {
            const req = {
                body: {
                    email: 'user@example.com',
                },
            };
            for (const validator of validation_1.validateLogin) {
                await validator(req, {}, () => { });
            }
            const errors = (0, express_validator_1.validationResult)(req);
            expect(errors.isEmpty()).toBe(false);
        });
    });
    describe('validateUpdateProfile', () => {
        it('should accept valid profile update', async () => {
            const req = {
                body: {
                    businessName: 'Updated Business',
                    phone: '+254798765432',
                    languagePreference: 'sw',
                    emailNotifications: false,
                    smsNotifications: true,
                },
            };
            for (const validator of validation_1.validateUpdateProfile) {
                await validator(req, {}, () => { });
            }
            const errors = (0, express_validator_1.validationResult)(req);
            expect(errors.isEmpty()).toBe(true);
        });
        it('should accept partial update', async () => {
            const req = {
                body: {
                    businessName: 'Partial Update',
                },
            };
            for (const validator of validation_1.validateUpdateProfile) {
                await validator(req, {}, () => { });
            }
            const errors = (0, express_validator_1.validationResult)(req);
            expect(errors.isEmpty()).toBe(true);
        });
        it('should reject invalid language preference', async () => {
            const req = {
                body: {
                    languagePreference: 'fr',
                },
            };
            for (const validator of validation_1.validateUpdateProfile) {
                await validator(req, {}, () => { });
            }
            const errors = (0, express_validator_1.validationResult)(req);
            expect(errors.isEmpty()).toBe(false);
        });
    });
});
//# sourceMappingURL=validation.test.js.map