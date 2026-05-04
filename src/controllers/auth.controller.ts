import { Request, Response } from 'express';
import prisma from '../prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { validarCedulaEcuatoriana } from '../utils/validators';

/**
 * POST /api/auth/register
 * Registrar nuevo usuario (paciente)
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { cedula, fullName, email, telefono, tipoSeguro, password } = req.body;

    // Validaciones
    if (!cedula || !fullName || !tipoSeguro || !password) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (!validarCedulaEcuatoriana(cedula)) {
      return res.status(400).json({ error: 'Cédula ecuatoriana inválida' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si ya existe
    const existingUser = await prisma.user.findUnique({
      where: { cedula }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Ya existe un usuario con esta cédula' });
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        return res.status(409).json({ error: 'Ya existe un usuario con este email' });
      }
    }

    // Hash de contraseña
    const hashedPassword = await hashPassword(password);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        cedula,
        username: cedula, // Username = cédula
        fullName,
        email,
        telefono,
        tipoSeguro,
        password: hashedPassword,
        role: 'paciente'
      },
      select: {
        id: true,
        cedula: true,
        fullName: true,
        email: true,
        telefono: true,
        tipoSeguro: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user
    });
  } catch (error: any) {
    console.error('Error en register:', error);
    res.status(500).json({ error: error.message || 'Error al registrar usuario' });
  }
};

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { cedula, password } = req.body;

    if (!cedula || !password) {
      return res.status(400).json({ error: 'Cédula y contraseña son requeridos' });
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { cedula },
      include: {
        medico: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar contraseña
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Generar token
    const token = generateToken({
      userId: user.id,
      cedula: user.cedula,
      role: user.role,
      fullName: user.fullName
    });

    // Preparar respuesta
    const userData: any = {
      id: user.id,
      cedula: user.cedula,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      telefono: user.telefono,
      tipoSeguro: user.tipoSeguro,
      role: user.role
    };

    // Si es médico, incluir datos adicionales
    if (user.medico) {
      userData.especialidad = user.medico.especialidad;
      userData.numeroLicencia = user.medico.numeroLicencia;
      userData.calificacion = user.medico.calificacion;
      userData.pacientesAtendidos = user.medico.pacientesAtendidos;
    }

    res.json({
      message: 'Login exitoso',
      token,
      user: userData
    });
  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(500).json({ error: error.message || 'Error al iniciar sesión' });
  }
};

/**
 * GET /api/auth/me
 * Obtener información del usuario actual
 */
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        cedula: true,
        username: true,
        fullName: true,
        email: true,
        telefono: true,
        tipoSeguro: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        medico: {
          select: {
            id: true,
            especialidad: true,
            numeroLicencia: true,
            calificacion: true,
            pacientesAtendidos: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Error en getMe:', error);
    res.status(500).json({ error: error.message || 'Error al obtener usuario' });
  }
};

/**
 * POST /api/auth/logout
 * Cerrar sesión del usuario
 * Nota: En JWT stateless, el logout se maneja principalmente en el frontend
 * eliminando el token. Este endpoint sirve para:
 * - Registrar auditoría de cierre de sesión
 * - Invalidar tokens si se implementa una blacklist
 * - Limpiar datos de sesión del servidor si existen
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const fullName = (req as any).user?.fullName;

    // Registrar el logout en logs (opcional: guardar en BD para auditoría)
    console.log(`Usuario ${fullName} (ID: ${userId}) cerró sesión - ${new Date().toISOString()}`);

    // TODO: Si implementas una blacklist de tokens, agregar el token aquí
    // const token = req.headers.authorization?.split(' ')[1];
    // await addToBlacklist(token);

    res.json({
      message: 'Sesión cerrada exitosamente',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: error.message || 'Error al cerrar sesión' });
  }
};
