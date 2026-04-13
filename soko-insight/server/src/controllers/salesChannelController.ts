import { Request, Response } from 'express';
import { SalesChannelModel } from '../models/SalesChannel';
import { sendSuccess, sendCreated, sendNotFound } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';

// Get all channels for current user
export const getChannels = asyncHandler(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true';
  const channels = await SalesChannelModel.findByUserId(req.user!.id, includeInactive);
  
  return sendSuccess(res, channels);
});

// Get single channel
export const getChannel = asyncHandler(async (req: Request, res: Response) => {
  const channel = await SalesChannelModel.findById(req.params.id, req.user!.id);
  
  if (!channel) {
    return sendNotFound(res, 'Sales channel not found');
  }
  
  return sendSuccess(res, channel);
});

// Create channel
export const createChannel = asyncHandler(async (req: Request, res: Response) => {
  const { channelName, channelType, platform, description } = req.body;
  
  const channel = await SalesChannelModel.create({
    userId: req.user!.id,
    channelName,
    channelType,
    platform,
    description,
  });
  
  return sendCreated(res, channel, 'Sales channel created successfully');
});

// Update channel
export const updateChannel = asyncHandler(async (req: Request, res: Response) => {
  const { channelName, channelType, platform, description, isActive } = req.body;
  
  const channel = await SalesChannelModel.update(req.params.id, req.user!.id, {
    channelName,
    channelType,
    platform,
    description,
    isActive,
  });
  
  if (!channel) {
    return sendNotFound(res, 'Sales channel not found');
  }
  
  return sendSuccess(res, channel, 'Sales channel updated successfully');
});

// Delete channel
export const deleteChannel = asyncHandler(async (req: Request, res: Response) => {
  const deleted = await SalesChannelModel.delete(req.params.id, req.user!.id);
  
  if (!deleted) {
    return sendNotFound(res, 'Sales channel not found');
  }
  
  return sendSuccess(res, null, 'Sales channel deleted successfully');
});

