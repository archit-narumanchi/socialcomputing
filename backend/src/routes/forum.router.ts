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

// --- Get all posts ---
// FIX: Changed :courseIdentifier to :courseCode to match isEnrolled middleware
router.get('/course/:courseCode/posts', isAuthenticated, async (req: AuthRequest, res) => {
  const { courseCode } = req.params; // Changed variable name
  const userId = req.userId;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // We can still use resolveCourseId just fine
    const courseId = await resolveCourseId(courseCode);
    if (!courseId) return res.status(404).json({ error: 'Course not found' });

    const posts = await prisma.post.findMany({
      where: { courseId: courseId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarConfig: true,
          },
        },
        likes: {
          where: { userId: userId },
          select: { userId: true },
        },
        _count: {
          select: { replies: true, likes: true },
        },
      },
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Create post ---
// FIX: Changed :courseIdentifier to :courseCode
router.post('/course/:courseCode/posts', isAuthenticated, isEnrolled, async (req: AuthRequest, res) => {
  const { courseCode } = req.params; // Changed variable name
  const userId = req.userId!;
  const { content } = req.body;

  if (!content) return res.status(400).json({ error: 'Content is required' });

  try {
    const courseId = await resolveCourseId(courseCode);
    if (!courseId) return res.status(404).json({ error: 'Course not found' });

    const newPost = await prisma.post.create({
      data: {
        content: content,
        userId: userId,
        courseId: courseId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarConfig: true,
          },
        },
      },
    });
    res.status(201).json(newPost);
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
    const newReply = await prisma.reply.create({
      data: {
        content: content,
        userId: userId,
        postId: parseInt(postId),
        parentId: parentId ? parseInt(parentId) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarConfig: true,
          },
        },
      },
    });
    res.status(201).json(newReply);
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
        user: {
          select: {
            id: true,
            username: true,
            avatarConfig: true,
          },
        },
        likes: { where: { userId: userId }, select: { userId: true } },
        _count: { select: { likes: true, children: true } },
        children: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarConfig: true,
              }
            },
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

// ... (Like endpoints remain unchanged)
router.post('/posts/:postId/like', isAuthenticated, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const userId = req.userId!;
  try {
    const existingLike = await prisma.like.findUnique({
      where: { userId_postId: { userId: userId, postId: parseInt(postId) } },
    });
    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      res.status(200).json({ message: 'Post unliked' });
    } else {
      await prisma.like.create({
        data: { userId: userId, postId: parseInt(postId) },
      });
      res.status(201).json({ message: 'Post liked' });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/replies/:replyId/like', isAuthenticated, async (req: AuthRequest, res) => {
  const { replyId } = req.params;
  const userId = req.userId!;
  try {
    const existingLike = await prisma.like.findUnique({
      where: { userId_replyId: { userId: userId, replyId: parseInt(replyId) } },
    });
    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      res.status(200).json({ message: 'Reply unliked' });
    } else {
      await prisma.like.create({
        data: { userId: userId, replyId: parseInt(replyId) },
      });
      res.status(201).json({ message: 'Reply liked' });
    }
  } catch (error) {
    console.error('Like reply error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;