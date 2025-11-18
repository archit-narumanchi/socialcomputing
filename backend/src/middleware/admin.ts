import { Response, NextFunction } from 'express';
import { prisma } from '../db';
import { AuthRequest } from './auth';

// This middleware MUST run *after* isAuthenticated
export const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // User is an admin, proceed
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};