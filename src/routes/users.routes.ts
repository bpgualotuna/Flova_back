import { Router } from 'express';
import prisma from '../prisma';
import { authMiddleware } from '../middlewares/auth';
import { requireRoles } from '../middlewares/roleGuard';
import { hashPassword } from '../utils/password';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * GET /api/users
 * Obtener todos los usuarios (Admin)
 */
router.get('/', requireRoles(['admin']), async (req, res) => {
  try {
    const { role } = req.query;

    const where: any = {};
    if (role) {
      where.role = role as string;
    }

    const users = await prisma.user.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(users);
  } catch (error: any) {
    console.error('Error en GET /users:', error);
    res.status(500).json({ error: error.message || 'Error al obtener usuarios' });
  }
});

/**
 * GET /api/users/:id
 * Obtener un usuario por ID (Admin o el mismo usuario)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    // Verificar permisos
    if (currentUser.role !== 'admin' && currentUser.userId !== parseInt(id)) {
      return res.status(403).json({ error: 'No tienes permiso para ver este usuario' });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
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
    console.error('Error en GET /users/:id:', error);
    res.status(500).json({ error: error.message || 'Error al obtener usuario' });
  }
});

/**
 * PUT /api/users/:id
 * Actualizar usuario (Admin o el mismo usuario)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;
    const { fullName, email, telefono, tipoSeguro, role, password } = req.body;

    // Verificar permisos
    if (currentUser.role !== 'admin' && currentUser.userId !== parseInt(id)) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este usuario' });
    }

    // Solo admin puede cambiar roles
    if (role && currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Solo los administradores pueden cambiar roles' });
    }

    const updateData: any = {};

    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (telefono) updateData.telefono = telefono;
    if (tipoSeguro) updateData.tipoSeguro = tipoSeguro;
    if (role && currentUser.role === 'admin') updateData.role = role;
    if (password) updateData.password = await hashPassword(password);

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        cedula: true,
        username: true,
        fullName: true,
        email: true,
        telefono: true,
        tipoSeguro: true,
        role: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Usuario actualizado exitosamente',
      user
    });
  } catch (error: any) {
    console.error('Error en PUT /users/:id:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar usuario' });
  }
});

/**
 * DELETE /api/users/:id
 * Eliminar usuario (Admin)
 */
router.delete('/:id', requireRoles(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error: any) {
    console.error('Error en DELETE /users/:id:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar usuario' });
  }
});

export default router;
