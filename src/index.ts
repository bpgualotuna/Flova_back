import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes';
import appointmentsRoutes from './routes/appointments.routes';
import doctorsRoutes from './routes/doctors.routes';
import therapiesRoutes from './routes/therapies.routes';
import usersRoutes from './routes/users.routes';
import statsRoutes from './routes/stats.routes';

import { errorHandler } from './middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Flova Backend API - Medical Appointment Management System',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/therapies', therapiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stats', statsRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log(`🏥 Flova Backend API`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log('========================================== 🚀');
  console.log('');
});

export default app;
