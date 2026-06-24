import { Router } from 'express';
import prisma from '../prisma';
import { authMiddleware } from '../middlewares/auth';
import { requireRoles } from '../middlewares/roleGuard';
import { hashPassword } from '../utils/password';

const router = Router();

router.use(authMiddleware);

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
        nationalId: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        insuranceType: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        doctor: {
          select: {
            id: true,
            specialty: true,
            licenseNumber: true,
            rating: true,
            patientsServed: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedUsers = users.map((user: any) => {
      if (user.doctor) {
        user.doctor.rating = parseFloat(user.doctor.rating.toString());
      }
      return user;
    });

    res.json(formattedUsers);
  } catch (error: any) {
    console.error('Error in GET /users:', error);
    res.status(500).json({ error: error.message || 'Error retrieving users' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    if (currentUser.role !== 'admin' && currentUser.userId !== parseInt(id)) {
      return res.status(403).json({ error: 'You do not have permission to view this user' });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nationalId: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        insuranceType: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        doctor: {
          select: {
            id: true,
            specialty: true,
            licenseNumber: true,
            rating: true,
            patientsServed: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.doctor) {
      user.doctor.rating = parseFloat(user.doctor.rating.toString()) as any;
    }

    res.json(user);
  } catch (error: any) {
    console.error('Error in GET /users/:id:', error);
    res.status(500).json({ error: error.message || 'Error retrieving user' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;
    const { fullName, email, phone, insuranceType, role, password } = req.body;

    if (currentUser.role !== 'admin' && currentUser.userId !== parseInt(id)) {
      return res.status(403).json({ error: 'You do not have permission to modify this user' });
    }

    if (role && currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can change roles' });
    }

    const updateData: any = {};

    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (insuranceType) updateData.insuranceType = insuranceType;
    if (role && currentUser.role === 'admin') updateData.role = role;
    if (password) updateData.password = await hashPassword(password);

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        nationalId: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        insuranceType: true,
        role: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error: any) {
    console.error('Error in PUT /users/:id:', error);
    res.status(500).json({ error: error.message || 'Error updating user' });
  }
});

router.delete('/:id', requireRoles(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /users/:id:', error);
    res.status(500).json({ error: error.message || 'Error deleting user' });
  }
});

export default router;
