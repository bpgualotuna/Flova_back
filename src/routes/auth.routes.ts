import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);

export default router;
