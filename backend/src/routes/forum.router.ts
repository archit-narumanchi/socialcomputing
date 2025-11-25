// backend/src/routes/forum.router.ts

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

// ... [GET /course/:courseCode/posts remains unchanged] ...
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

// --- Create post (Reward: 1 Coin) ---
router.post('/course/:courseCode/posts', isAuthenticated, isEnrolled, async (req: AuthRequest, res) => {
  const { courseCode } = req.params;
  const userId = req.userId!;
  const { content } = req.body;

  if (!content) return res.status(400).json({ error: 'Content is required' });

  try {
    const courseId = await resolveCourseId(courseCode);
    if (!courseId) return res.status(404).json({ error: 'Course not found' });

    // Use transaction to create post AND award coin
    const [newPost, _updatedUser] = await prisma.$transaction([
      prisma.post.create({
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
      }),
      // REWARD: 1 Coin for making a post
      prisma.user.update({
        where: { id: userId },
        data: { coins: { increment: 1 } }
      })
    ]);

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Reply to post (Reward: 1 Coin per 2 replies) ---
router.post('/posts/:postId/reply', isAuthenticated, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const userId = req.userId!;
  const { content, parentId } = req.body;

  if (!content) return res.status(400).json({ error: 'Content is required' });

  try {
    const newReply = await prisma.$transaction(async (tx) => {
        // 1. Create the reply
        const reply = await tx.reply.create({
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

        // 2. Check total replies by user to see if we award a coin
        // Logic: If total replies (including this one) is even, award 1 coin
        const replyCount = await tx.reply.count({
            where: { userId: userId }
        });

        if (replyCount % 2 === 0) {
            await tx.user.update({
                where: { id: userId },
                data: { coins: { increment: 1 } }
            });
        }

        return reply;
    });

    res.status(201).json(newReply);
  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ... [Get replies endpoint remains unchanged] ...
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

// --- Like Post (Reward: 1 Coin per 3 likes) ---
router.post('/posts/:postId/like', isAuthenticated, async (req: AuthRequest, res) => {
  const { postId } = req.params;
  const userId = req.userId!;
  try {
    const result = await prisma.$transaction(async (tx) => {
        const existingLike = await tx.like.findUnique({
            where: { userId_postId: { userId: userId, postId: parseInt(postId) } },
        });

        if (existingLike) {
            await tx.like.delete({ where: { id: existingLike.id } });
            return { message: 'Post unliked' };
        } else {
            await tx.like.create({
                data: { userId: userId, postId: parseInt(postId) },
            });

            // REWARD Logic: Count total likes (posts + replies)
            const likeCount = await tx.like.count({ where: { userId: userId } });
            
            if (likeCount % 3 === 0) {
                await tx.user.update({
                    where: { id: userId },
                    data: { coins: { increment: 1 } }
                });
            }
            
            return { message: 'Post liked' };
        }
    });
    
    // Determine status code based on action (created vs deleted)
    const status = result.message === 'Post liked' ? 201 : 200;
    res.status(status).json(result);

  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Like Reply (Reward: 1 Coin per 3 likes) ---
router.post('/replies/:replyId/like', isAuthenticated, async (req: AuthRequest, res) => {
  const { replyId } = req.params;
  const userId = req.userId!;
  try {
    const result = await prisma.$transaction(async (tx) => {
        const existingLike = await tx.like.findUnique({
            where: { userId_replyId: { userId: userId, replyId: parseInt(replyId) } },
        });

        if (existingLike) {
            await tx.like.delete({ where: { id: existingLike.id } });
            return { message: 'Reply unliked' };
        } else {
            await tx.like.create({
                data: { userId: userId, replyId: parseInt(replyId) },
            });

            // REWARD Logic: Count total likes (posts + replies)
            const likeCount = await tx.like.count({ where: { userId: userId } });

            if (likeCount % 3 === 0) {
                await tx.user.update({
                    where: { id: userId },
                    data: { coins: { increment: 1 } }
                });
            }

            return { message: 'Reply liked' };
        }
    });

    const status = result.message === 'Reply liked' ? 201 : 200;
    res.status(status).json(result);
  } catch (error) {
    console.error('Like reply error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;