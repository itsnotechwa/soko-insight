"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChannel = exports.updateChannel = exports.createChannel = exports.getChannel = exports.getChannels = void 0;
const SalesChannel_1 = require("../models/SalesChannel");
const response_1 = require("../utils/response");
const errorHandler_1 = require("../middleware/errorHandler");
// Get all channels for current user
exports.getChannels = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    const channels = await SalesChannel_1.SalesChannelModel.findByUserId(req.user.id, includeInactive);
    return (0, response_1.sendSuccess)(res, channels);
});
// Get single channel
exports.getChannel = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const channel = await SalesChannel_1.SalesChannelModel.findById(req.params.id, req.user.id);
    if (!channel) {
        return (0, response_1.sendNotFound)(res, 'Sales channel not found');
    }
    return (0, response_1.sendSuccess)(res, channel);
});
// Create channel
exports.createChannel = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { channelName, channelType, platform, description } = req.body;
    const channel = await SalesChannel_1.SalesChannelModel.create({
        userId: req.user.id,
        channelName,
        channelType,
        platform,
        description,
    });
    return (0, response_1.sendCreated)(res, channel, 'Sales channel created successfully');
});
// Update channel
exports.updateChannel = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { channelName, channelType, platform, description, isActive } = req.body;
    const channel = await SalesChannel_1.SalesChannelModel.update(req.params.id, req.user.id, {
        channelName,
        channelType,
        platform,
        description,
        isActive,
    });
    if (!channel) {
        return (0, response_1.sendNotFound)(res, 'Sales channel not found');
    }
    return (0, response_1.sendSuccess)(res, channel, 'Sales channel updated successfully');
});
// Delete channel
exports.deleteChannel = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const deleted = await SalesChannel_1.SalesChannelModel.delete(req.params.id, req.user.id);
    if (!deleted) {
        return (0, response_1.sendNotFound)(res, 'Sales channel not found');
    }
    return (0, response_1.sendSuccess)(res, null, 'Sales channel deleted successfully');
});
//# sourceMappingURL=salesChannelController.js.map