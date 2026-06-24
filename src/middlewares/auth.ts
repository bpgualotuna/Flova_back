import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import prisma from '../prisma';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token not provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token not provided' });
    }

    const isBlacklisted = await prisma.blacklistedToken.findUnique({
      where: { token }
    });

    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    const decoded = verifyToken(token);
    (req as any).user = decoded;

    next();
  } catch (error: any) {
    console.error('Error in authMiddleware:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
