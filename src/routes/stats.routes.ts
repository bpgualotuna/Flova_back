import { Router } from 'express';
import { getAdminStats, getFinanzasStats } from '../controllers/stats.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireRoles } from '../middlewares/roleGuard';

const router = Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(authMiddleware);
router.use(requireRoles(['admin']));

// Estadísticas generales
router.get('/admin', getAdminStats);

// Estadísticas financieras
router.get('/finanzas', getFinanzasStats);

export default router;
