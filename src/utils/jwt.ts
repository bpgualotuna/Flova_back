import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const JWT_SECRET: string = process.env.JWT_SECRET || 'default_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: number;
  nationalId?: string;
  cedula?: string;
  username?: string;
  role: string;
  fullName: string;
  [key: string]: any;
}

// In-memory set for instantaneous blacklist checks and fallback
const blacklistedTokensSet = new Set<string>();

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

export const revokeToken = async (token: string): Promise<void> => {
  if (!token) return;
  blacklistedTokensSet.add(token);

  try {
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
  } catch (error: any) {
    // If database table is not present or proxy has issue, in-memory blacklist guarantees protection
    console.warn('Could not persist revoked token in database, keeping in memory:', error?.message);
  }
};

export const isTokenRevoked = async (token: string): Promise<boolean> => {
  if (!token) return true;
  if (blacklistedTokensSet.has(token)) {
    return true;
  }

  try {
    const record = await prisma.blacklistedToken.findUnique({
      where: { token }
    });
    if (record) {
      blacklistedTokensSet.add(token);
      return true;
    }
  } catch (error: any) {
    // Database query failed, rely on in-memory set
  }

  return false;
};
