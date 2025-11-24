import { Router } from 'express';
import { prisma } from '../db';
import { isAuthenticated, AuthRequest } from '../middleware/auth';
import { Prisma, type Course } from '@prisma/client';

const router = Router();

// --- Search for Courses ---
// GET /api/courses/search?q=intro
router.get('/search', isAuthenticated, async (req: AuthRequest, res) => {
  const query = req.query.q as string;

  if (!query) {
    return res.status(400).json({ error: 'Search query "q" is required' });
  }

  try {
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            courseCode: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      take: 20,
    });
    res.status(200).json(courses);
  } catch (error) {
    console.error('Course search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Join (Enroll in) a Course by Code ---
// POST /api/courses/:courseCode/join
router.post('/:courseCode/join', isAuthenticated, async (req: AuthRequest, res) => {
  const { courseCode } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Find the course first using the unique courseCode
    const course = await prisma.course.findUnique({
      where: { courseCode: courseCode },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 2. Create the enrollment using the found ID
    const newEnrollment = await prisma.enrollment.create({
      data: {
        userId: userId,
        courseId: course.id,
      },
      include: {
        course: true,
      },
    });
    res.status(201).json(newEnrollment);
  } catch (error) {
    // --- FIX 1 (continued): Use Prisma.PrismaClientKnownRequestError ---
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific error for duplicate enrollment
      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
        return res.status(409).json({ error: 'User is already enrolled in this course' });
      }
    }
    console.error('Course join error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Get My Enrolled Courses ---
// GET /api/courses/my
router.get('/my', isAuthenticated, async (req: AuthRequest, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: userId,
      },
      include: {
        course: true,
      },
    });

    const courses = enrollments.map((e: { course: Course }) => e.course);
    res.status(200).json(courses);
    
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;