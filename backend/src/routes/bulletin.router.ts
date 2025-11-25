import { Router } from 'express';
import { prisma } from '../db';
import { isAuthenticated, AuthRequest } from '../middleware/auth';
import { isEnrolled } from '../middleware/enrollment';

const router = Router();

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

    const meme = await prisma.memePost.findFirst({
      where: {
        courseId: course.id,
      },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true } } },
    });

    res.status(200).json(meme || { message: 'No meme yet this week' });
  } catch (error) {
    console.error('Get meme error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/bulletin/course/:courseCode/meme
router.post('/course/:courseCode/meme', isAuthenticated, isEnrolled, async (req: AuthRequest, res) => {
  const { courseCode } = req.params;
  const userId = req.userId!;
  const { imageUrl } = req.body;
  const MEME_COST = 3; // Cost to post a meme

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

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: course.id,
        },
      },
    });

    if (!enrollment?.isTopContributor) {
      return res.status(403).json({ error: 'Only the Top Contributor can post a meme!' });
    }

    // --- TRANSACTION: Check Balance, Deduct Coins, Create Meme ---
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      
      if (!user || user.coins < MEME_COST) {
        throw new Error(`Not enough coins. You need ${MEME_COST} coins to post a meme.`);
      }

      // Deduct coins
      await tx.user.update({
        where: { id: userId },
        data: { coins: { decrement: MEME_COST } },
      });

      // Create Meme
      return await tx.memePost.create({
        data: {
          imageUrl: imageUrl,
          userId: userId,
          courseId: course.id,
        },
      });
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Post meme error:', error);
    if (error.message.includes('Not enough coins')) {
        return res.status(402).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;