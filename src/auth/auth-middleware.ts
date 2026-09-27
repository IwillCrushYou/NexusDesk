import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { config } from '../config';
import { AuthService } from './auth-service';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: UserRole; email: string };
    }
  }
}

export function requireAuth(auth: AuthService) {
  return async (request: Request, response: Response, next: NextFunction) => {
    const header = request.header('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) {
      return response.status(401).json({ error: 'Authentication required' });
    }

    try {
      const payload = jwt.verify(token, config.jwtSecret);
      if (typeof payload === 'string' || !payload.sub || typeof payload.email !== 'string' || typeof payload.role !== 'string') {
        return response.status(401).json({ error: 'Invalid token' });
      }
      const user = await auth.getUser(payload.sub);
      if (!user) {
        return response.status(401).json({ error: 'User no longer exists' });
      }
      request.user = { id: user.id, role: user.role, email: user.email };
      return next();
    } catch {
      return response.status(401).json({ error: 'Invalid token' });
    }
  };
}

export function requireRole(...roles: UserRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return response.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}
