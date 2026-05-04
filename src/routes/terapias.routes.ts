import { Router } from 'express';
import { getTerapias, getTerapiaById, createTerapia, updateTerapia, deleteTerapia } from '../controllers/terapias.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireRoles } from '../middlewares/roleGuard';

const router = Router();

// Rutas públicas (o protegidas para todos)
router.get('/', getTerapias);
router.get('/:id', getTerapiaById);

// Rutas solo para admin
router.post('/', authMiddleware, requireRoles(['admin']), createTerapia);
router.put('/:id', authMiddleware, requireRoles(['admin']), updateTerapia);
router.delete('/:id', authMiddleware, requireRoles(['admin']), deleteTerapia);

export default router;
