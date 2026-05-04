import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'default_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: number;
  cedula: string;
  role: string;
  fullName: string;
}

export const generateToken = (payload: JwtPayload): string => {
  // @ts-ignore - TypeScript tiene problemas con el tipo de expiresIn pero funciona correctamente en runtime
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
