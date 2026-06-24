import { Router } from 'express';
import { getAdminStats, getFinancialStats } from '../controllers/stats.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireRoles } from '../middlewares/roleGuard';

const router = Router();

router.use(authMiddleware);
router.use(requireRoles(['admin']));

router.get('/admin', getAdminStats);
router.get('/financial', getFinancialStats);

export default router;
