import { Router } from 'express';
import { prisma } from '../db';
import { isAuthenticated, AuthRequest } from '../middleware/auth';
import { isEnrolled } from '../middleware/enrollment';

const router = Router();

// --- Get the latest Meme for a course ---
// GET /api/bulletin/course/:courseId/meme
router.get('/course/:courseId/meme', isAuthenticated, isEnrolled, async (req: AuthRequest, res) => {
  const { courseId } = req.params;

  try {
    // Get the most recent meme post
    const meme = await prisma.memePost.findFirst({
      where: {
        courseId: parseInt(courseId),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: { username: true },
        },
      },
    });

    res.status(200).json(meme || { message: 'No meme yet this week' });
  } catch (error) {
    console.error('Get meme error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Post a Meme (Winner Only) ---
// POST /api/bulletin/course/:courseId/meme
router.post('/course/:courseId/meme', isAuthenticated, isEnrolled, async (req: AuthRequest, res) => {
  const { courseId } = req.params;
  const userId = req.userId!;
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  try {
    // 1. Check if the user is the Top Contributor
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: parseInt(courseId),
        },
      },
    });

    if (!enrollment?.isTopContributor) {
      return res.status(403).json({ error: 'Only the Top Contributor can post a meme!' });
    }

    // 2. Create the meme post
    const newMeme = await prisma.memePost.create({
      data: {
        imageUrl: imageUrl,
        userId: userId,
        courseId: parseInt(courseId),
      },
    });

    res.status(201).json(newMeme);
  } catch (error) {
    console.error('Post meme error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;