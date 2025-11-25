import { Router } from 'express';
import { prisma } from '../db';
import { isAuthenticated, AuthRequest } from '../middleware/auth';
import { isEnrolled } from '../middleware/enrollment';

const router = Router();

// --- Get all Memes/Notices for a course ---
// GET /api/bulletin/course/:courseCode/meme
router.get('/course/:courseCode/meme', isAuthenticated, isEnrolled, async (req: AuthRequest, res) => {
  const { courseCode } = req.params;

  try {
    const course = await prisma.course.findUnique({
      where: { courseCode: courseCode },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Fetch ALL memes for the course, newest first
    const memes = await prisma.memePost.findMany({
      where: {
        courseId: course.id,
      },
      orderBy: { createdAt: 'desc' },
      include: { 
        user: { 
          select: { username: true, avatarConfig: true } 
        } 
      },
    });

    res.status(200).json(memes);
  } catch (error) {
    console.error('Get memes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Post a Meme/Notice ---
// POST /api/bulletin/course/:courseCode/meme
router.post('/course/:courseCode/meme', isAuthenticated, isEnrolled, async (req: AuthRequest, res) => {
  const { courseCode } = req.params;
  const userId = req.userId!;
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  try {
    const course = await prisma.course.findUnique({
      where: { courseCode: courseCode },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // NOTE: Removed "isTopContributor" check to allow general uploading
    const newMeme = await prisma.memePost.create({
      data: {
        imageUrl: imageUrl,
        userId: userId,
        courseId: course.id,
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    res.status(201).json(newMeme);
  } catch (error) {
    console.error('Post meme error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;