import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  pollNotifications,
  streamNotifications,
  markNotificationRead
} from '../controllers/notificationController.js';

const router = Router();

router.get('/poll', authenticate, pollNotifications);
router.get('/stream', authenticate, streamNotifications);
router.patch('/:id/read', authenticate, markNotificationRead);

export default router;
