import { Response, NextFunction } from 'express';
import { prisma } from '../db';
import { AuthRequest } from './auth';
import { z } from 'zod';

// Validate that courseCode is a string (at least 1 char)
const paramsSchema = z.object({
  courseCode: z.string().min(1),
});

export const isEnrolled = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const validation = paramsSchema.safeParse(req.params);
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid course code format' });
  }
  
  const { courseCode } = validation.data;

  try {
    // 1. Find the course first
    const course = await prisma.course.findUnique({
      where: { courseCode: courseCode },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 2. Check enrollment using the found ID
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: course.id,
        },
      },
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Forbidden: You are not enrolled in this course' });
    }

    next();
  } catch (error) {
    console.error('Enrollment middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};