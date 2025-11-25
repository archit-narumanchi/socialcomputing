import { Router } from 'express';
import { prisma } from '../db';
import { isAuthenticated, AuthRequest } from '../middleware/auth';
import { Prisma, type Course } from '@prisma/client';

const router = Router();

// Helper to resolve Course ID from a param that might be an ID or a Code
async function resolveCourseId(identifier: string): Promise<number | null> {
  // 1. Try to parse as ID
  const id = parseInt(identifier);
  if (!isNaN(id)) return id;

  // 2. If not a number, try to find by courseCode
  const course = await prisma.course.findUnique({
    where: { courseCode: identifier },
    select: { id: true }
  });
  
  return course ? course.id : null;
}

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

// --- Join (Enroll in) a Course ---
// POST /api/courses/:courseIdentifier/join
// Accepts either ID (123) or Code (CS101)
router.post('/:courseIdentifier/join', isAuthenticated, async (req: AuthRequest, res) => {
  const { courseIdentifier } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Resolve the identifier to an ID
    const courseId = await resolveCourseId(courseIdentifier);

    if (!courseId) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 2. Verify the course exists (optional, but good for safety if resolve just parsed an int)
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 3. Create the enrollment
    const newEnrollment = await prisma.enrollment.create({
      data: {
        userId: userId,
        courseId: courseId,
      },
      include: {
        course: true,
      },
    });
    res.status(201).json(newEnrollment);
  } catch (error) {
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