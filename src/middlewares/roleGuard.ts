import { Request, Response, NextFunction } from 'express';

export const requireRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Admin siempre tiene acceso
    if (user.role === 'admin') {
      return next();
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        error: 'No tienes permisos para acceder a este recurso',
        requiredRoles: allowedRoles,
        yourRole: user.role
      });
    }

    next();
  };
};
