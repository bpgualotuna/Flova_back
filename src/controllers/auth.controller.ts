import { Request, Response } from 'express';
import prisma from '../prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, revokeToken } from '../utils/jwt';
import { validateEcuadorianId, validateEmail, validatePassword, isValidRole } from '../utils/validators';

export const register = async (req: Request, res: Response) => {
  try {
    const cedula = req.body.cedula || req.body.nationalId;
    const fullName = req.body.fullName;
    const email = req.body.email;
    const telefono = req.body.telefono || req.body.phone;
    const tipoSeguro = req.body.tipoSeguro || req.body.insuranceType;
    const password = req.body.password;
    const username = req.body.username || cedula;
    const role = req.body.role || 'paciente';

    if (!cedula || !fullName || !tipoSeguro || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!validateEcuadorianId(cedula)) {
      return res.status(400).json({ error: 'Invalid Ecuadorian national ID' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (email && !validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!isValidRole(role)) {
      return res.status(400).json({ error: 'Invalid role. Valid roles are: admin, medico, paciente' });
    }

    // Rule 1: cedula and username must be unique
    const existingCedula = await prisma.user.findUnique({
      where: { cedula }
    });
    if (existingCedula) {
      return res.status(409).json({ error: 'A user with this national ID already exists' });
    }

    if (username !== cedula) {
      const existingUsername = await prisma.user.findUnique({
        where: { username }
      });
      if (existingUsername) {
        return res.status(409).json({ error: 'A user with this username already exists' });
      }
    }

    // Rule 2: Email, when present, must be unique
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingEmail = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });
      if (existingEmail) {
        return res.status(409).json({ error: 'A user with this email already exists' });
      }
    }

    // Rule 3: Hash password with bcrypt
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        cedula,
        username,
        fullName,
        email: email ? email.trim().toLowerCase() : null,
        telefono: telefono || null,
        tipoSeguro,
        password: hashedPassword,
        role,
        activo: true
      }
    });

    // Rule 4: Never return password in response
    const formattedUser = {
      id: user.id,
      cedula: user.cedula,
      nationalId: user.cedula,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      telefono: user.telefono,
      phone: user.telefono,
      tipoSeguro: user.tipoSeguro,
      insuranceType: user.tipoSeguro,
      role: user.role,
      activo: user.activo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return res.status(201).json({
      message: 'User registered successfully',
      user: formattedUser
    });
  } catch (error: any) {
    console.error('Error in register:', error);
    return res.status(500).json({ error: error.message || 'Error registering user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const identifier = req.body.cedula || req.body.nationalId || req.body.username;
    const password = req.body.password;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'National ID and password are required' });
    }

    let user = await prisma.user.findUnique({
      where: { cedula: identifier },
      include: {
        medico: true
      }
    });

    if (!user) {
      user = await prisma.user.findUnique({
        where: { username: identifier },
        include: {
          medico: true
        }
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Rule 6: Un usuario desactivado no debe autenticarse ni realizar operaciones nuevas
    if (user.activo === false) {
      return res.status(401).json({ error: 'User account is deactivated' });
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = generateToken({
      userId: user.id,
      cedula: user.cedula,
      nationalId: user.cedula,
      username: user.username,
      role: user.role,
      fullName: user.fullName
    });

    // Rule 4: Never return password in response
    const userData: any = {
      id: user.id,
      cedula: user.cedula,
      nationalId: user.cedula,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      telefono: user.telefono,
      phone: user.telefono,
      tipoSeguro: user.tipoSeguro,
      insuranceType: user.tipoSeguro,
      role: user.role,
      activo: user.activo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    if (user.medico) {
      const calificacion = typeof user.medico.calificacion === 'number'
        ? user.medico.calificacion
        : parseFloat(user.medico.calificacion?.toString() || '0');

      userData.medico = {
        id: user.medico.id,
        especialidad: user.medico.especialidad,
        numeroLicencia: user.medico.numeroLicencia,
        calificacion,
        pacientesAtendidos: user.medico.pacientesAtendidos
      };
      userData.doctor = userData.medico;
      userData.specialty = user.medico.especialidad;
      userData.especialidad = user.medico.especialidad;
      userData.licenseNumber = user.medico.numeroLicencia;
      userData.numeroLicencia = user.medico.numeroLicencia;
      userData.rating = calificacion;
      userData.calificacion = calificacion;
      userData.patientsServed = user.medico.pacientesAtendidos;
      userData.pacientesAtendidos = user.medico.pacientesAtendidos;
    }

    return res.json({
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error: any) {
    console.error('Error in login:', error);
    return res.status(500).json({ error: error.message || 'Error signing in' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        medico: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.activo === false) {
      return res.status(401).json({ error: 'User account is deactivated' });
    }

    // Rule 4: Never return password
    const formattedUser: any = {
      id: user.id,
      cedula: user.cedula,
      nationalId: user.cedula,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      telefono: user.telefono,
      phone: user.telefono,
      tipoSeguro: user.tipoSeguro,
      insuranceType: user.tipoSeguro,
      role: user.role,
      activo: user.activo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    if (user.medico) {
      const calificacion = typeof user.medico.calificacion === 'number'
        ? user.medico.calificacion
        : parseFloat(user.medico.calificacion?.toString() || '0');

      formattedUser.medico = {
        id: user.medico.id,
        especialidad: user.medico.especialidad,
        numeroLicencia: user.medico.numeroLicencia,
        calificacion,
        pacientesAtendidos: user.medico.pacientesAtendidos
      };
      formattedUser.doctor = formattedUser.medico;
      formattedUser.specialty = user.medico.especialidad;
      formattedUser.especialidad = user.medico.especialidad;
      formattedUser.licenseNumber = user.medico.numeroLicencia;
      formattedUser.numeroLicencia = user.medico.numeroLicencia;
      formattedUser.rating = calificacion;
      formattedUser.calificacion = calificacion;
      formattedUser.patientsServed = user.medico.pacientesAtendidos;
      formattedUser.pacientesAtendidos = user.medico.pacientesAtendidos;
    }

    return res.json(formattedUser);
  } catch (error: any) {
    console.error('Error in getMe:', error);
    return res.status(500).json({ error: error.message || 'Error retrieving user' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const fullName = (req as any).user?.fullName;

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      await revokeToken(token);
    }

    console.log(`User ${fullName} (ID: ${userId}) logged out - ${new Date().toISOString()}`);

    return res.json({
      message: 'Session closed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in logout:', error);
    return res.status(500).json({ error: error.message || 'Error logging out' });
  }
};
