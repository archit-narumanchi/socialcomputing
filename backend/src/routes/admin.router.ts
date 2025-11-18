import { Router } from 'express';
import { prisma } from '../db';
import { isAuthenticated } from '../middleware/auth';
import { isAdmin } from '../middleware/admin';
import { z } from 'zod';
// Use Prisma namespace to access known request error type
import { Prisma } from '@prisma/client';

const router = Router();

// Zod schema to validate the new course data
const courseSchema = z.object({
  courseCode: z.string().min(3),
  title: z.string().min(5),
  semester: z.string().min(3),
});

// --- Create a new Course (ClassCafe) ---
// POST /api/admin/courses
// Protected by: Must be logged in AND be an admin
router.post('/courses', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // 1. Validate the request body
    const validation = courseSchema.safeParse(req.body);
    if (!validation.success) {
      // --- FIX 2: Use .issues, not .errors ---
      return res.status(400).json({ error: 'Invalid data', details: validation.error.issues });
    }

    const { courseCode, title, semester } = validation.data;

    // 2. Create the new course
    const newCourse = await prisma.course.create({
      data: {
        courseCode,
        title,
        semester,
      },
    });

    res.status(201).json(newCourse);
  } catch (error) {
    // Handle if course code is not unique
    // Use Prisma.PrismaClientKnownRequestError to detect unique constraint violations
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'A course with this code already exists' });
      }
    }
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;