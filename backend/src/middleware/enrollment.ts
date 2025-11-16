import { Response, NextFunction } from 'express';
import { prisma } from '../db';
import { AuthRequest } from './auth';
import { z } from 'zod';

// Zod schema to validate that the URL param is a number
const paramsSchema = z.object({
  courseId: z.string().regex(/^\d+$/, "Course ID must be a number"),
});

// This middleware checks if a user is enrolled in the course they are trying to access
export const isEnrolled = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.userId;

  // 1. Check if user is authenticated
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Validate the URL parameter
  const validation = paramsSchema.safeParse(req.params);
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid course ID format' });
  }
  
  const { courseId } = validation.data;

  try {
    // 3. Check if an enrollment record exists
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: parseInt(courseId),
        },
      },
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Forbidden: You are not enrolled in this course' });
    }

    // 4. If they are enrolled, proceed to the route
    next();
  } catch (error) {
    console.error('Enrollment middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};