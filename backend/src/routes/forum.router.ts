import { Router } from 'express';
import { prisma } from '../db';
import { isAuthenticated, AuthRequest } from '../middleware/auth';
import { isEnrolled } from '../middleware/enrollment';
import { Prisma } from '@prisma/client';

const router = Router();

// --- Get all posts for a course (ClassCafe) ---
// GET /api/forum/course/123/posts
// Protected by: Must be logged in
router.get('/course/:courseId/posts', isAuthenticated, async (req: AuthRequest, res) => {
  const { courseId } = req.params;
  // FIX: Extract userId so we can check if the user liked the posts
  const userId = req.userId!; 

  try {
    const posts = await prisma.post.findMany({
      where: {
        courseId: parseInt(courseId),
      },
      orderBy: {
        createdAt: 'desc', // Show newest posts first
      },
      include: {
        user: { // Show who wrote the post
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
        _count: { // Get the number of replies and likes
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

// --- Create a new post in a course (ClassCafe) ---
// POST /api/forum/course/123/posts
// Protected by: Must be logged in AND enrolled in the course
router.post('/course/:courseId/posts', isAuthenticated, isEnrolled, async (req: AuthRequest, res) => {
  const { courseId } = req.params;
  const userId = req.userId!;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const newPost = await prisma.post.create({
      data: {
        content: content,
        userId: userId,
        courseId: parseInt(courseId),
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

// --- Reply to a post (supports nested replies) ---
// POST /api/forum/posts/:postId/reply
// Body: { content: "...", parentId: 123 (optional) }
router.post('/posts/:postId/reply', isAuthenticated, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const userId = req.userId!;
  const { content, parentId } = req.body; // Get parentId from body

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const newReply = await prisma.reply.create({
      data: {
        content: content,
        userId: userId,
        postId: parseInt(postId),
        parentId: parentId ? parseInt(parentId) : null, // Link to parent reply if provided
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

// --- Get all replies for a post (including nested ones) ---
// GET /api/forum/posts/:postId/replies
router.get('/posts/:postId/replies', isAuthenticated, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  // FIX: Extract userId so we can check if the user liked the replies
  const userId = req.userId!;

  try {
    const replies = await prisma.reply.findMany({
      where: {
        postId: parseInt(postId),
        parentId: null, // Only get top-level replies first
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
        // Check if THIS user liked the reply
        likes: {
          where: { userId: userId },
          select: { userId: true },
        },
        _count: {
          select: {
            likes: true,
            children: true, // Count nested replies
          },
        },
        // Recursively fetch children (nested replies)
        children: {
          include: {
            user: { select: { id: true, username: true } },
            // Check if THIS user liked the nested reply
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
// POST /api/forum/posts/456/like
// Protected by: Must be logged in
router.post('/posts/:postId/like', isAuthenticated, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const userId = req.userId!;

  try {
    // Check if the like already exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: parseInt(postId),
        },
      },
    });

    if (existingLike) {
      // User is "unliking"
      await prisma.like.delete({ where: { id: existingLike.id } });
      res.status(200).json({ message: 'Post unliked' });
    } else {
      // User is "liking"
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
// POST /api/forum/replies/789/like
// Protected by: Must be logged in
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
      // User is "unliking"
      await prisma.like.delete({ where: { id: existingLike.id } });
      res.status(200).json({ message: 'Reply unliked' });
    } else {
      // User is "liking"
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