import { Router } from 'express';
import { getCitas, getCitaById, createCita, updateCita, cancelCita, getHorariosDisponibles } from '../controllers/citas.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireRoles } from '../middlewares/roleGuard';

const router = Router();

// Todas las rutas de citas requieren autenticación
router.use(authMiddleware);

// Horarios disponibles
router.get('/horarios-disponibles', getHorariosDisponibles);

// CRUD de citas
router.get('/', getCitas);
router.get('/:id', getCitaById);
router.post('/', requireRoles(['paciente']), createCita);
router.put('/:id', requireRoles(['medico', 'admin']), updateCita);
router.delete('/:id', cancelCita);

export default router;
