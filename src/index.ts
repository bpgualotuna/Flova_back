import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

// Rutas
import authRoutes from './routes/auth.routes';
import citasRoutes from './routes/citas.routes';
import medicosRoutes from './routes/medicos.routes';
import terapiasRoutes from './routes/terapias.routes';
import usersRoutes from './routes/users.routes';
import statsRoutes from './routes/stats.routes';

// Middleware de errores
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

// Seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Compresión
app.use(compression());

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// RUTAS
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Flova Backend API - Sistema de Gestión de Citas Médicas',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/medicos', medicosRoutes);
app.use('/api/terapias', terapiasRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stats', statsRoutes);

// ============================================
// MANEJO DE ERRORES
// ============================================

app.use(errorHandler);

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log(`🏥 Flova Backend API`);
  console.log(`📡 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log('========================================== 🚀');
  console.log('');
});

export default app;
