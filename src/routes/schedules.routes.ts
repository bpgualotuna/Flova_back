import { Router } from 'express';
import { updateSchedule, deleteSchedule } from '../controllers/doctors.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireRoles } from '../middlewares/roleGuard';

const router = Router();

// Actualizar horario (Admin o Médico asignado)
router.put('/:id', authMiddleware, requireRoles(['admin', 'medico']), updateSchedule);

// Desactivar horario (baja lógica, Admin o Médico asignado)
router.delete('/:id', authMiddleware, requireRoles(['admin', 'medico']), deleteSchedule);

export default router;
