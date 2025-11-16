import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// We'll attach the user's ID to the request object
export interface AuthRequest extends Request {
  userId?: number;
}

export const isAuthenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined');
    return res.status(500).json({ error: 'Internal server error' });
  }

  try {
    // Verify the token
    const payload = jwt.verify(token, jwtSecret) as { userId: number };
    
    // Attach user ID to the request object for later use
    req.userId = payload.userId;
    
    // Call the next middleware or route handler
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};