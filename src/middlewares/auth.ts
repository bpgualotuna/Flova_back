import { Request, Response, NextFunction } from 'express';
import { verifyToken, isTokenRevoked } from '../utils/jwt';
import prisma from '../prisma';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token not provided' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const token = parts[1];

    if (!token) {
      return res.status(401).json({ error: 'Token not provided' });
    }

    const isRevoked = await isTokenRevoked(token);
    if (isRevoked) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (err: any) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found or deleted' });
    }

    if (user.activo === false) {
      return res.status(401).json({ error: 'User account is deactivated' });
    }

    (req as any).user = {
      ...decoded,
      userId: user.id,
      cedula: user.cedula,
      nationalId: user.cedula,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      activo: user.activo
    };

    next();
  } catch (error: any) {
    console.error('Error in authMiddleware:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
