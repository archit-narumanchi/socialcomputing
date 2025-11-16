import { Router } from 'express';
import { prisma } from '../db';
import { isAuthenticated, AuthRequest } from '../middleware/auth';
// --- FIX 1: Use Prisma.PrismaClientKnownRequestError and import Course as a type ---
import { Prisma, type Course } from '@prisma/client';

const router = Router();

// --- Search for Courses ---
// GET /api/courses/search?q=intro
// A protected route for any logged-in user to find courses
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
              mode: 'insensitive', // Makes search case-insensitive
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
      take: 20, // Limit results to 20
    });
    res.status(200).json(courses);
  } catch (error) {
    console.error('Course search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Join (Enroll in) a Course ---
// POST /api/courses/123/join
// A protected route for a user to enroll in a course
router.post('/:courseId/join', isAuthenticated, async (req: AuthRequest, res) => {
  const { courseId } = req.params;
  const userId = req.userId; // We get this from the isAuthenticated middleware

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Create the enrollment record
    const newEnrollment = await prisma.enrollment.create({
      data: {
        userId: userId,
        courseId: parseInt(courseId),
      },
      include: {
        course: true, // Include the course details in the response
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
// A protected route to get all courses the current user is enrolled in
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
        course: true, // This is what your frontend needs
      },
    });

    // --- FIX 2: Explicitly type 'e' to satisfy TypeScript ---
    // We just want to return the list of courses, not the enrollment object
    const courses = enrollments.map((e: { course: Course }) => e.course);
    res.status(200).json(courses);
    
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;