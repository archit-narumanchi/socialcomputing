import { Router } from 'express';
import { prisma } from '../db';
import { isAuthenticated, AuthRequest } from '../middleware/auth';
import { isEnrolled } from '../middleware/enrollment';

const router = Router();

// --- Get all Memes/Notices for a course ---
router.get('/course/:courseCode/meme', isAuthenticated, isEnrolled, async (req: AuthRequest, res) => {
  const { courseCode } = req.params;

  try {
    const course = await prisma.course.findUnique({
      where: { courseCode: courseCode },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const memes = await prisma.memePost.findMany({
      where: { courseId: course.id },
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
router.post('/course/:courseCode/meme', isAuthenticated, isEnrolled, async (req: AuthRequest, res) => {
  const { courseCode } = req.params;
  const userId = req.userId!;
  const { imageUrl } = req.body;
  const MEME_COST = 5;

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

    // Transaction: Check balance, Deduct coins, Create Post
    const result = await prisma.$transaction(async (tx) => {
        // 1. Check User Balance
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user || user.coins < MEME_COST) {
            throw new Error(`Insufficient coins. Posting a meme costs ${MEME_COST} coins.`);
        }

        // 2. Deduct Coins and get updated record
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: { coins: { decrement: MEME_COST } },
            select: { coins: true } // Return the new coin count
        });

        // 3. Create Meme Post
        const newMeme = await tx.memePost.create({
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

        // Return both the meme and the new balance
        return { meme: newMeme, newCoins: updatedUser.coins };
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Post meme error:', error);
    if (error.message?.includes('Insufficient coins')) {
        return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;