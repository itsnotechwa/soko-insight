import { Router } from 'express';
import * as salesChannelController from '../controllers/salesChannelController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/errorHandler';
import { validateSalesChannel, validateUUID } from '../utils/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all channels
router.get('/', salesChannelController.getChannels);

// Get single channel
router.get('/:id', validateUUID('id'), validate, salesChannelController.getChannel);

// Create channel
router.post('/', validateSalesChannel, validate, salesChannelController.createChannel);

// Update channel
router.put('/:id', validateUUID('id'), validateSalesChannel, validate, salesChannelController.updateChannel);

// Delete channel
router.delete('/:id', validateUUID('id'), validate, salesChannelController.deleteChannel);

export default router;

