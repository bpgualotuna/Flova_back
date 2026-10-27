import { Router } from 'express';
import {
  getDoctors,
  getDoctorById,
  getDoctorsBySpecialty,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  createSchedule,
  getSchedulesByDoctor
} from '../controllers/doctors.controller';
import { authMiddleware } from '../middlewares/auth';
import { requireRoles } from '../middlewares/roleGuard';

const router = Router();

// ============================================
// RUTAS DE MÉDICOS
// ============================================

// Listar médicos (público / autenticado)
router.get('/', getDoctors);

// Filtrar médicos por especialidad
router.get('/specialty/:specialty', getDoctorsBySpecialty);
router.get('/especialidad/:specialty', getDoctorsBySpecialty);

// Consultar médico por ID
router.get('/:id', getDoctorById);

// Crear médico (solo administrador)
router.post('/', authMiddleware, requireRoles(['admin']), createDoctor);

// Actualizar médico (solo administrador)
router.put('/:id', authMiddleware, requireRoles(['admin']), updateDoctor);

// Desactivar médico (baja lógica, solo administrador)
router.delete('/:id', authMiddleware, requireRoles(['admin']), deleteDoctor);

// ============================================
// RUTAS DE HORARIOS ASOCIADOS A MÉDICO
// ============================================

// Listar horarios activos de un médico
router.get('/:id/schedules', getSchedulesByDoctor);
router.get('/:id/horarios', getSchedulesByDoctor);

// Crear horario para un médico (admin o médico propietario)
router.post('/:id/schedules', authMiddleware, requireRoles(['admin', 'medico']), createSchedule);
router.post('/:id/horarios', authMiddleware, requireRoles(['admin', 'medico']), createSchedule);

export default router;
