import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Not authorized, admin only' });
  }
  next();
};

export const protect = (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    // @ts-ignore
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};
