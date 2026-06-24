import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { validateEcuadorianId } from '../utils/validators';

export const register = async (req: Request, res: Response) => {
  try {
    const { nationalId, fullName, email, phone, insuranceType, password } = req.body;

    if (!nationalId || !fullName || !insuranceType || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!validateEcuadorianId(nationalId)) {
      return res.status(400).json({ error: 'Invalid Ecuadorian national ID' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { nationalId }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'A user with this national ID already exists' });
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        return res.status(409).json({ error: 'A user with this email already exists' });
      }
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        nationalId,
        username: nationalId,
        fullName,
        email,
        phone,
        insuranceType,
        password: hashedPassword,
        role: 'paciente'
      },
      select: {
        id: true,
        nationalId: true,
        fullName: true,
        email: true,
        phone: true,
        insuranceType: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'User registered successfully',
      user
    });
  } catch (error: any) {
    console.error('Error in register:', error);
    res.status(500).json({ error: error.message || 'Error registering user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { nationalId, password } = req.body;

    if (!nationalId || !password) {
      return res.status(400).json({ error: 'National ID and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { nationalId },
      include: {
        doctor: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = generateToken({
      userId: user.id,
      nationalId: user.nationalId,
      role: user.role,
      fullName: user.fullName
    });

    const userData: any = {
      id: user.id,
      nationalId: user.nationalId,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      insuranceType: user.insuranceType,
      role: user.role
    };

    if (user.doctor) {
      userData.specialty = user.doctor.specialty;
      userData.licenseNumber = user.doctor.licenseNumber;
      userData.rating = parseFloat(user.doctor.rating.toString());
      userData.patientsServed = user.doctor.patientsServed;
    }

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error: any) {
    console.error('Error in login:', error);
    res.status(500).json({ error: error.message || 'Error signing in' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    console.error('Error in getMe:', error);
    res.status(500).json({ error: error.message || 'Error retrieving user' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const fullName = (req as any).user?.fullName;

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      const decoded: any = jwt.decode(token);
      const expiresAt = decoded?.exp 
        ? new Date(decoded.exp * 1000) 
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.blacklistedToken.create({
        data: {
          token,
          expiresAt
        }
      });
    }

    console.log(`User ${fullName} (ID: ${userId}) logged out - ${new Date().toISOString()}`);

    res.json({
      message: 'Session closed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in logout:', error);
    res.status(500).json({ error: error.message || 'Error logging out' });
  }
};
