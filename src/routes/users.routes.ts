import { Router } from 'express';
import prisma from '../prisma';
import { authMiddleware } from '../middlewares/auth';
import { requireRoles } from '../middlewares/roleGuard';
import { hashPassword } from '../utils/password';
import {
  validateEcuadorianId,
  validateEmail,
  validatePassword,
  isValidRole
} from '../utils/validators';

const router = Router();

const formatUser = (u: any) => {
  if (!u) return null;
  const formatted: any = {
    id: u.id,
    cedula: u.cedula,
    nationalId: u.cedula,
    username: u.username,
    fullName: u.fullName,
    email: u.email,
    telefono: u.telefono,
    phone: u.telefono,
    tipoSeguro: u.tipoSeguro,
    insuranceType: u.tipoSeguro,
    role: u.role,
    activo: u.activo,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  };

  if (u.medico) {
    const calificacion = typeof u.medico.calificacion === 'number'
      ? u.medico.calificacion
      : parseFloat(u.medico.calificacion?.toString() || '0');

    formatted.medico = {
      id: u.medico.id,
      especialidad: u.medico.especialidad,
      numeroLicencia: u.medico.numeroLicencia,
      calificacion,
      pacientesAtendidos: u.medico.pacientesAtendidos
    };
    formatted.doctor = formatted.medico;
    formatted.specialty = u.medico.especialidad;
    formatted.especialidad = u.medico.especialidad;
    formatted.licenseNumber = u.medico.numeroLicencia;
    formatted.numeroLicencia = u.medico.numeroLicencia;
    formatted.rating = calificacion;
    formatted.calificacion = calificacion;
    formatted.patientsServed = u.medico.pacientesAtendidos;
    formatted.pacientesAtendidos = u.medico.pacientesAtendidos;
  }

  return formatted;
};

router.use(authMiddleware);

// GET /api/users - List and filter users (Admin only)
router.get('/', requireRoles(['admin']), async (req, res) => {
  try {
    const { role, activo } = req.query;

    const where: any = {};
    if (role) {
      where.role = role as string;
    }
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        medico: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json(users.map(formatUser));
  } catch (error: any) {
    console.error('Error in GET /users:', error);
    return res.status(500).json({ error: error.message || 'Error retrieving users' });
  }
});

// GET /api/users/:id - Get user by ID (Owner or Admin)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const currentUser = (req as any).user;

    // Rule 7: Un usuario normal solo puede consultar o modificar su propio perfil
    if (currentUser.role !== 'admin' && currentUser.userId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to view this user' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        medico: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(formatUser(user));
  } catch (error: any) {
    console.error('Error in GET /users/:id:', error);
    return res.status(500).json({ error: error.message || 'Error retrieving user' });
  }
});

// PUT /api/users/:id - Update user (Owner or Admin)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const currentUser = (req as any).user;

    // Rule 7: Un usuario normal solo puede consultar o modificar su propio perfil
    if (currentUser.role !== 'admin' && currentUser.userId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to modify this user' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const {
      fullName,
      email,
      phone,
      telefono,
      insuranceType,
      tipoSeguro,
      role,
      password,
      activo,
      nationalId,
      cedula,
      username
    } = req.body;

    // Rule 8: Solo admin puede cambiar roles
    if (role !== undefined) {
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Only administrators can change roles' });
      }
      if (!isValidRole(role)) {
        return res.status(400).json({ error: 'Invalid role. Valid roles are: admin, medico, paciente' });
      }
    }

    if (activo !== undefined && currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can change active status' });
    }

    // Rule 3: Contraseña mínimo 6 caracteres
    if (password !== undefined) {
      if (!validatePassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
    }

    // Rule 2: Correo válido y único
    if (email !== undefined && email !== null && email !== '') {
      if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== existingUser.email) {
        const emailConflict = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        });
        if (emailConflict && emailConflict.id !== userId) {
          return res.status(409).json({ error: 'A user with this email already exists' });
        }
      }
    }

    // Rule 1: cedula única
    const newCedula = cedula || nationalId;
    if (newCedula !== undefined && newCedula !== existingUser.cedula) {
      if (!validateEcuadorianId(newCedula)) {
        return res.status(400).json({ error: 'Invalid Ecuadorian national ID' });
      }
      const cedulaConflict = await prisma.user.findUnique({
        where: { cedula: newCedula }
      });
      if (cedulaConflict && cedulaConflict.id !== userId) {
        return res.status(409).json({ error: 'A user with this national ID already exists' });
      }
    }

    // Rule 1: username único
    if (username !== undefined && username !== existingUser.username) {
      const usernameConflict = await prisma.user.findUnique({
        where: { username }
      });
      if (usernameConflict && usernameConflict.id !== userId) {
        return res.status(409).json({ error: 'A user with this username already exists' });
      }
    }

    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email ? email.trim().toLowerCase() : null;
    if (telefono !== undefined || phone !== undefined) updateData.telefono = telefono || phone;
    if (tipoSeguro !== undefined || insuranceType !== undefined) {
      updateData.tipoSeguro = tipoSeguro || insuranceType;
    }
    if (newCedula !== undefined) updateData.cedula = newCedula;
    if (username !== undefined) updateData.username = username;
    if (role !== undefined && currentUser.role === 'admin') updateData.role = role;
    if (activo !== undefined && currentUser.role === 'admin') updateData.activo = activo;
    if (password) updateData.password = await hashPassword(password);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        medico: true
      }
    });

    return res.json({
      message: 'User updated successfully',
      user: formatUser(updatedUser)
    });
  } catch (error: any) {
    console.error('Error in PUT /users/:id:', error);
    return res.status(500).json({ error: error.message || 'Error updating user' });
  }
});

// DELETE /api/users/:id - Deactivate or delete user (Admin only)
router.delete('/:id', requireRoles(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const permanent = req.query.permanent === 'true' || req.query.hard === 'true';
    if (permanent) {
      await prisma.user.delete({
        where: { id: userId }
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { activo: false }
      });
    }

    return res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /users/:id:', error);
    return res.status(500).json({ error: error.message || 'Error deleting user' });
  }
});

export default router;
