import { Router } from 'express';
import { getMedicos, getMedicoById, getMedicosByEspecialidad } from '../controllers/medicos.controller';

const router = Router();

// Rutas públicas
router.get('/', getMedicos);
router.get('/especialidad/:especialidad', getMedicosByEspecialidad);
router.get('/:id', getMedicoById);

export default router;
