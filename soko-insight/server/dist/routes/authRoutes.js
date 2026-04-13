"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController = __importStar(require("../controllers/authController"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_1 = require("../utils/validation");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', validation_1.validateRegister, errorHandler_1.validate, authController.register);
router.post('/login', validation_1.validateLogin, errorHandler_1.validate, authController.login);
router.get('/plans', authController.getPricingPlans);
// Protected routes
router.get('/me', auth_1.authenticate, authController.getMe);
router.put('/profile', auth_1.authenticate, validation_1.validateUpdateProfile, errorHandler_1.validate, authController.updateProfile);
router.put('/subscription', auth_1.authenticate, validation_1.validateUpdateSubscription, errorHandler_1.validate, authController.updateSubscription);
router.put('/change-password', auth_1.authenticate, [
    (0, express_validator_1.body)('currentPassword').notEmpty().withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/\d/)
        .withMessage('Password must contain at least one number')
        .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
            throw new Error('New password must be different from current password');
        }
        return true;
    }),
], errorHandler_1.validate, authController.changePassword);
router.post('/deactivate', auth_1.authenticate, [(0, express_validator_1.body)('password').notEmpty().withMessage('Password is required')], errorHandler_1.validate, authController.deactivateAccount);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map