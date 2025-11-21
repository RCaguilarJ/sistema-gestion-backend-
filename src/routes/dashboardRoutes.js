import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getDashboardStats } from '../controllers/dashboardController.js';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', authenticate, getDashboardStats);

export default router;