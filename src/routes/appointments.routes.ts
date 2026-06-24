import { Router } from 'express';
import { getAppointments, getAppointmentById, createAppointment, updateAppointment, cancelAppointment, getAvailableSchedules } from '../controllers/appointments.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireRoles } from '../middlewares/roleGuard';

const router = Router();

router.use(authMiddleware);

router.get('/available-schedules', getAvailableSchedules);
router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.post('/', requireRoles(['paciente']), createAppointment);
router.put('/:id', requireRoles(['medico', 'admin']), updateAppointment);
router.delete('/:id', cancelAppointment);

export default router;
