"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSubscription = exports.getPricingPlans = exports.deactivateAccount = exports.changePassword = exports.updateProfile = exports.getMe = exports.login = exports.register = void 0;
const User_1 = require("../models/User");
const SalesChannel_1 = require("../models/SalesChannel");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const errorHandler_1 = require("../middleware/errorHandler");
const pricing_1 = require("../config/pricing");
// Register new user
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password, businessName, phone, sellerType } = req.body;
    // Check if email already exists
    const existingUser = await User_1.UserModel.findByEmail(email);
    if (existingUser) {
        return (0, response_1.sendError)(res, 'Email already registered', 409);
    }
    // Create user
    const user = await User_1.UserModel.create({
        email,
        password,
        businessName,
        phone,
        sellerType,
    });
    // Create default sales channels based on seller type
    await SalesChannel_1.SalesChannelModel.createDefaults(user.id, sellerType);
    // Generate token
    const token = (0, auth_1.generateToken)({
        id: user.id,
        email: user.email,
        businessName: user.businessName,
        sellerType: user.sellerType,
        subscriptionTier: user.subscriptionTier,
    });
    // Update last login
    await User_1.UserModel.updateLastLogin(user.id);
    return (0, response_1.sendCreated)(res, {
        user: (0, User_1.toPublicUser)(user),
        token,
    }, 'Registration successful');
});
// Login user
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    // Find user by email
    const user = await User_1.UserModel.findByEmail(email);
    if (!user) {
        return (0, response_1.sendUnauthorized)(res, 'Invalid email or password');
    }
    // Check if user is active
    if (!user.isActive) {
        return (0, response_1.sendError)(res, 'Account is deactivated', 403);
    }
    // Verify password
    const isValidPassword = await User_1.UserModel.verifyPassword(user, password);
    if (!isValidPassword) {
        return (0, response_1.sendUnauthorized)(res, 'Invalid email or password');
    }
    // Generate token
    const token = (0, auth_1.generateToken)({
        id: user.id,
        email: user.email,
        businessName: user.businessName,
        sellerType: user.sellerType,
        subscriptionTier: user.subscriptionTier,
    });
    // Update last login
    await User_1.UserModel.updateLastLogin(user.id);
    return (0, response_1.sendSuccess)(res, {
        user: (0, User_1.toPublicUser)(user),
        token,
    }, 'Login successful');
});
// Get current user
exports.getMe = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await User_1.UserModel.findById(req.user.id);
    if (!user) {
        return (0, response_1.sendError)(res, 'User not found', 404);
    }
    return (0, response_1.sendSuccess)(res, (0, User_1.toPublicUser)(user));
});
// Update profile
exports.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { businessName, phone, languagePreference, emailNotifications, smsNotifications } = req.body;
    const user = await User_1.UserModel.update(req.user.id, {
        businessName,
        phone,
        languagePreference,
        emailNotifications,
        smsNotifications,
    });
    if (!user) {
        return (0, response_1.sendError)(res, 'User not found', 404);
    }
    return (0, response_1.sendSuccess)(res, (0, User_1.toPublicUser)(user), 'Profile updated successfully');
});
// Change password
exports.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User_1.UserModel.findById(req.user.id);
    if (!user) {
        return (0, response_1.sendError)(res, 'User not found', 404);
    }
    // Verify current password
    const isValidPassword = await User_1.UserModel.verifyPassword(user, currentPassword);
    if (!isValidPassword) {
        return (0, response_1.sendError)(res, 'Current password is incorrect', 400);
    }
    // Update password
    await User_1.UserModel.updatePassword(user.id, newPassword);
    // Generate new token
    const token = (0, auth_1.generateToken)({
        id: user.id,
        email: user.email,
        businessName: user.businessName,
        sellerType: user.sellerType,
        subscriptionTier: user.subscriptionTier,
    });
    return (0, response_1.sendSuccess)(res, { token }, 'Password changed successfully');
});
// Deactivate account
exports.deactivateAccount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { password } = req.body;
    const user = await User_1.UserModel.findById(req.user.id);
    if (!user) {
        return (0, response_1.sendError)(res, 'User not found', 404);
    }
    // Verify password
    const isValidPassword = await User_1.UserModel.verifyPassword(user, password);
    if (!isValidPassword) {
        return (0, response_1.sendError)(res, 'Password is incorrect', 400);
    }
    // Deactivate user
    await User_1.UserModel.deactivate(user.id);
    return (0, response_1.sendSuccess)(res, null, 'Account deactivated successfully');
});
// Get publicly visible pricing plans
exports.getPricingPlans = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const plans = Object.values(pricing_1.PRICING_PLANS);
    return (0, response_1.sendSuccess)(res, { currency: 'KES', plans });
});
// Update subscription tier
exports.updateSubscription = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { subscriptionTier } = req.body;
    const user = await User_1.UserModel.update(req.user.id, { subscriptionTier });
    if (!user) {
        return (0, response_1.sendError)(res, 'User not found', 404);
    }
    const token = (0, auth_1.generateToken)({
        id: user.id,
        email: user.email,
        businessName: user.businessName,
        sellerType: user.sellerType,
        subscriptionTier: user.subscriptionTier,
    });
    return (0, response_1.sendSuccess)(res, { user: (0, User_1.toPublicUser)(user), token }, `Subscription updated to ${user.subscriptionTier}`);
});
//# sourceMappingURL=authController.js.map