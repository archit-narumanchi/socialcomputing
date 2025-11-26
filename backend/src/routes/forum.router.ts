import { Router } from 'express';
import { prisma } from '../db';
import { isAuthenticated, AuthRequest } from '../middleware/auth';
import { isEnrolled } from '../middleware/enrollment';
import { Prisma } from '@prisma/client';

const router = Router();

async function resolveCourseId(identifier: string): Promise<number | null> {
  const id = parseInt(identifier);
  if (!isNaN(id)) return id;
  const course = await prisma.course.findUnique({
    where: { courseCode: identifier },
    select: { id: true }
  });
  return course ? course.id : null;
}

// Helper: Reward author if total likes hit a multiple of 10
async function checkAndRewardAuthor(authorId: number) {
    const totalLikesReceived = await prisma.like.count({
        where: {
            OR: [
                { post: { userId: authorId } },
                { reply: { userId: authorId } }
            ]
        }
    });

    // Log for debugging
    console.log(`User ${authorId} total likes: ${totalLikesReceived}`);

    if (totalLikesReceived > 0 && totalLikesReceived % 10 === 0) {
        await prisma.user.update({
            where: { id: authorId },
            data: { coins: { increment: 1 } }
        });
        console.log(`Reward triggered for User ${authorId}`);
    }
}

// --- Get all posts ---
router.get('/course/:courseCode/posts', isAuthenticated, async (req: AuthRequest, res) => {
  const { courseCode } = req.params;
  const userId = req.userId;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const courseId = await resolveCourseId(courseCode);
    if (!courseId) return res.status(404).json({ error: 'Course not found' });

    const posts = await prisma.post.findMany({
      where: { courseId: courseId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, avatarConfig: true } },
        likes: { where: { userId: userId }, select: { userId: true } },
        _count: { select: { replies: true, likes: true } },
      },
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Create post ---
router.post('/course/:courseCode/posts', isAuthenticated, isEnrolled, async (req: AuthRequest, res) => {
  const { courseCode } = req.params;
  const userId = req.userId!;
  const { content } = req.body;

  if (!content) return res.status(400).json({ error: 'Content is required' });

  try {
    const courseId = await resolveCourseId(courseCode);
    if (!courseId) return res.status(404).json({ error: 'Course not found' });

    const result = await prisma.$transaction(async (tx) => {
        const post = await tx.post.create({
            data: { content, userId, courseId },
            include: { user: { select: { id: true, username: true, avatarConfig: true } } },
        });
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: { coins: { increment: 1 } },
            select: { coins: true }
        });
        return { post, newCoins: updatedUser.coins };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Reply to post ---
router.post('/posts/:postId/reply', isAuthenticated, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const userId = req.userId!;
  const { content, parentId } = req.body;

  if (!content) return res.status(400).json({ error: 'Content is required' });

  try {
    const result = await prisma.$transaction(async (tx) => {
        const newReply = await tx.reply.create({
            data: {
                content,
                userId,
                postId: parseInt(postId),
                parentId: parentId ? parseInt(parentId) : null,
            },
            include: { user: { select: { id: true, username: true, avatarConfig: true } } },
        });

        const replyCount = await tx.reply.count({ where: { userId } });
        let newCoins = null;

        if (replyCount > 0 && replyCount % 2 === 0) {
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { coins: { increment: 1 } },
                select: { coins: true }
            });
            newCoins = updatedUser.coins;
        }
        return { reply: newReply, newCoins };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Get replies ---
router.get('/posts/:postId/replies', isAuthenticated, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const userId = req.userId!;

  try {
    const replies = await prisma.reply.findMany({
      where: { postId: parseInt(postId), parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, username: true, avatarConfig: true } },
        likes: { where: { userId: userId }, select: { userId: true } },
        _count: { select: { likes: true, children: true } },
        children: {
          include: {
            user: { select: { id: true, username: true, avatarConfig: true } },
            likes: { where: { userId: userId }, select: { userId: true } },
            _count: { select: { likes: true } }
          }
        }
      },
    });
    res.status(200).json(replies);
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Like Post ---
router.post('/posts/:postId/like', isAuthenticated, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const userId = req.userId!;
  try {
    const pId = parseInt(postId);
    const existingLike = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId: pId } },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      // Return current coins even on unlike, just to sync
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { coins: true } });
      res.status(200).json({ message: 'Post unliked', newCoins: user?.coins });
    } else {
      await prisma.like.create({
        data: { userId, postId: pId },
      });
      
      // Reward author
      const post = await prisma.post.findUnique({ where: { id: pId }, select: { userId: true } });
      if (post) {
          await checkAndRewardAuthor(post.userId);
      }

      // Return current coins of the LIKER (in case they liked their own post and got rewarded)
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { coins: true } });
      res.status(201).json({ message: 'Post liked', newCoins: user?.coins });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Like Reply ---
router.post('/replies/:replyId/like', isAuthenticated, async (req: AuthRequest, res) => {
  const { replyId } = req.params;
  const userId = req.userId!;
  try {
    const rId = parseInt(replyId);
    const existingLike = await prisma.like.findUnique({
      where: { userId_replyId: { userId, replyId: rId } },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { coins: true } });
      res.status(200).json({ message: 'Reply unliked', newCoins: user?.coins });
    } else {
      await prisma.like.create({
        data: { userId, replyId: rId },
      });

      // Reward author
      const reply = await prisma.reply.findUnique({ where: { id: rId }, select: { userId: true } });
      if (reply) {
          await checkAndRewardAuthor(reply.userId);
      }

      // Return current coins of the LIKER
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { coins: true } });
      res.status(201).json({ message: 'Reply liked', newCoins: user?.coins });
    }
  } catch (error) {
    console.error('Like reply error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;