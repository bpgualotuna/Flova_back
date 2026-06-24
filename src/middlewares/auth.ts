import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token not provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token not provided' });
    }

    const decoded = verifyToken(token);
    (req as any).user = decoded;

    next();
  } catch (error: any) {
    console.error('Error in authMiddleware:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
