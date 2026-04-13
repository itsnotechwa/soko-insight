import { Request, Response } from 'express';
import { UserModel, toPublicUser } from '../models/User';
import { SalesChannelModel } from '../models/SalesChannel';
import { generateToken } from '../middleware/auth';
import { sendSuccess, sendCreated, sendError, sendUnauthorized } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { PRICING_PLANS } from '../config/pricing';

// Register new user
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, businessName, phone, sellerType } = req.body;
  
  // Check if email already exists
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    return sendError(res, 'Email already registered', 409);
  }
  
  // Create user
  const user = await UserModel.create({
    email,
    password,
    businessName,
    phone,
    sellerType,
  });
  
  // Create default sales channels based on seller type
  await SalesChannelModel.createDefaults(user.id, sellerType);
  
  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    businessName: user.businessName,
    sellerType: user.sellerType,
    subscriptionTier: user.subscriptionTier,
  });
  
  // Update last login
  await UserModel.updateLastLogin(user.id);
  
  return sendCreated(res, {
    user: toPublicUser(user),
    token,
  }, 'Registration successful');
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  // Find user by email
  const user = await UserModel.findByEmail(email);
  if (!user) {
    return sendUnauthorized(res, 'Invalid email or password');
  }
  
  // Check if user is active
  if (!user.isActive) {
    return sendError(res, 'Account is deactivated', 403);
  }
  
  // Verify password
  const isValidPassword = await UserModel.verifyPassword(user, password);
  if (!isValidPassword) {
    return sendUnauthorized(res, 'Invalid email or password');
  }
  
  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    businessName: user.businessName,
    sellerType: user.sellerType,
    subscriptionTier: user.subscriptionTier,
  });
  
  // Update last login
  await UserModel.updateLastLogin(user.id);
  
  return sendSuccess(res, {
    user: toPublicUser(user),
    token,
  }, 'Login successful');
});

// Get current user
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.user!.id);
  
  if (!user) {
    return sendError(res, 'User not found', 404);
  }
  
  return sendSuccess(res, toPublicUser(user));
});

// Update profile
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { businessName, phone, languagePreference, emailNotifications, smsNotifications } = req.body;
  
  const user = await UserModel.update(req.user!.id, {
    businessName,
    phone,
    languagePreference,
    emailNotifications,
    smsNotifications,
  });
  
  if (!user) {
    return sendError(res, 'User not found', 404);
  }
  
  return sendSuccess(res, toPublicUser(user), 'Profile updated successfully');
});

// Change password
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = await UserModel.findById(req.user!.id);
  if (!user) {
    return sendError(res, 'User not found', 404);
  }
  
  // Verify current password
  const isValidPassword = await UserModel.verifyPassword(user, currentPassword);
  if (!isValidPassword) {
    return sendError(res, 'Current password is incorrect', 400);
  }
  
  // Update password
  await UserModel.updatePassword(user.id, newPassword);
  
  // Generate new token
  const token = generateToken({
    id: user.id,
    email: user.email,
    businessName: user.businessName,
    sellerType: user.sellerType,
    subscriptionTier: user.subscriptionTier,
  });
  
  return sendSuccess(res, { token }, 'Password changed successfully');
});

// Deactivate account
export const deactivateAccount = asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body;
  
  const user = await UserModel.findById(req.user!.id);
  if (!user) {
    return sendError(res, 'User not found', 404);
  }
  
  // Verify password
  const isValidPassword = await UserModel.verifyPassword(user, password);
  if (!isValidPassword) {
    return sendError(res, 'Password is incorrect', 400);
  }
  
  // Deactivate user
  await UserModel.deactivate(user.id);
  
  return sendSuccess(res, null, 'Account deactivated successfully');
});

// Get publicly visible pricing plans
export const getPricingPlans = asyncHandler(async (_req: Request, res: Response) => {
  const plans = Object.values(PRICING_PLANS);
  return sendSuccess(res, { currency: 'KES', plans });
});

// Update subscription tier
export const updateSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { subscriptionTier } = req.body;

  const user = await UserModel.update(req.user!.id, { subscriptionTier });
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    businessName: user.businessName,
    sellerType: user.sellerType,
    subscriptionTier: user.subscriptionTier,
  });

  return sendSuccess(
    res,
    { user: toPublicUser(user), token },
    `Subscription updated to ${user.subscriptionTier}`
  );
});

