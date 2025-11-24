import { Router } from 'express';
import { prisma } from '../db';
import { isAuthenticated, AuthRequest } from '../middleware/auth';
import { isEnrolled } from '../middleware/enrollment';
import { Prisma } from '@prisma/client';

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

// --- Get all posts for a course ---
// GET /api/forum/course/:courseIdOrCode/posts
router.get('/course/:courseIdentifier/posts', isAuthenticated, async (req: AuthRequest, res) => {
  const { courseIdentifier } = req.params;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User ID missing' });
  }

  try {
    // Resolve the identifier (ID or Code) to a numeric ID
    const courseId = await resolveCourseId(courseIdentifier);
    if (!courseId) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const posts = await prisma.post.findMany({
      where: {
        courseId: courseId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        // Check if THIS user liked the post
        likes: {
          where: { userId: userId },
          select: { userId: true },
        },
        _count: {
          select: {
            replies: true,
            likes: true,
          },
        },
      },
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Create a new post ---
router.post('/course/:courseIdentifier/posts', isAuthenticated, isEnrolled, async (req: AuthRequest, res) => {
  const { courseIdentifier } = req.params;
  const userId = req.userId!;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const courseId = await resolveCourseId(courseIdentifier);
    if (!courseId) {
      return res.status(404).json({ error: 'Course not found' });
    }

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

// --- Reply to a post ---
router.post('/posts/:postId/reply', isAuthenticated, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const userId = req.userId!;
  const { content, parentId } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

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

// --- Get all replies for a post ---
router.get('/posts/:postId/replies', isAuthenticated, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const userId = req.userId!;

  try {
    const replies = await prisma.reply.findMany({
      where: {
        postId: parseInt(postId),
        parentId: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        likes: {
          where: { userId: userId },
          select: { userId: true },
        },
        _count: {
          select: {
            likes: true,
            children: true,
          },
        },
        children: {
          include: {
            user: { select: { id: true, username: true } },
            likes: {
               where: { userId: userId },
               select: { userId: true }
            },
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

// --- Like a Post ---
router.post('/posts/:postId/like', isAuthenticated, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const userId = req.userId!;

  try {
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: parseInt(postId),
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      res.status(200).json({ message: 'Post unliked' });
    } else {
      await prisma.like.create({
        data: {
          userId: userId,
          postId: parseInt(postId),
        },
      });
      res.status(201).json({ message: 'Post liked' });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Like a Reply ---
router.post('/replies/:replyId/like', isAuthenticated, async (req: AuthRequest, res) => {
  const { replyId } = req.params;
  const userId = req.userId!;

  try {
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_replyId: {
          userId: userId,
          replyId: parseInt(replyId),
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      res.status(200).json({ message: 'Reply unliked' });
    } else {
      await prisma.like.create({
        data: {
          userId: userId,
          replyId: parseInt(replyId),
        },
      });
      res.status(201).json({ message: 'Reply liked' });
    }
  } catch (error) {
    console.error('Like reply error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;