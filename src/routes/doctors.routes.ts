import { Router } from 'express';
import { getDoctors, getDoctorById, getDoctorsBySpecialty } from '../controllers/doctors.controller';

const router = Router();

router.get('/', getDoctors);
router.get('/specialty/:specialty', getDoctorsBySpecialty);
router.get('/:id', getDoctorById);

export default router;
