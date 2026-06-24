import { Router } from 'express';
import { getTherapies, getTherapyById, createTherapy, updateTherapy, deleteTherapy } from '../controllers/therapies.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireRoles } from '../middlewares/roleGuard';

const router = Router();

router.get('/', getTherapies);
router.get('/:id', getTherapyById);
router.post('/', authMiddleware, requireRoles(['admin']), createTherapy);
router.put('/:id', authMiddleware, requireRoles(['admin']), updateTherapy);
router.delete('/:id', authMiddleware, requireRoles(['admin']), deleteTherapy);

export default router;
