import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.warn(`[AUTH] Unauthorized access attempt: No user found in request context.`);
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      console.warn(`[AUTH] Forbidden access attempt: User ${req.user.email} (Role: ${req.user.role}) attempted to access resource requiring [${roles.join(', ')}].`);
      return res.status(403).json({ error: 'Permission denied: Insufficient privileges' });
    }
    
    next();
  };
};
