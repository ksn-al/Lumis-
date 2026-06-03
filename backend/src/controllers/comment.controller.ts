import { Response } from 'express';
import prisma from '../utils/prisma';
const logger = require('../utils/logger');

const commentInclude = {
  user: { select: { id: true, username: true, displayname: true, avatar: true } },
  likes: { select: { userId: true } },
};

function withCommentMeta(comment: any, userId?: string) {
  return {
    ...comment,
    likesCount: comment.likes.length,
    liked: userId ? comment.likes.some((l: any) => l.userId === userId) : false,
  };
}

/** GET /posts/:postId/comments */
export const getComments = async (req: any, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const comments = await prisma.comment.findMany({
      where:   { postId },
      orderBy: { createdAt: 'asc' },
      take:    100,
      include: commentInclude,
    });

    res.json(comments.map((c: any) => withCommentMeta(c, userId)));
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/** POST /posts/:postId/comments */
export const createComment = async (req: any, res: Response) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    if (!text || text.trim().length === 0 || text.length > 280) {
      return res.status(400).json({ message: 'Text required (max 280 chars)' });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = await prisma.comment.create({
      data: { text: text.trim(), userId, postId },
      include: commentInclude,
    });

    res.status(201).json(withCommentMeta(comment, userId));
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/** POST /posts/comments/:commentId/like */
export const likeComment = async (req: any, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.userId;

    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      await prisma.commentLike.delete({ where: { userId_commentId: { userId, commentId } } });
      return res.json({ liked: false });
    }

    await prisma.commentLike.create({ data: { userId, commentId } });
    res.status(201).json({ liked: true });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/** DELETE /posts/comments/:commentId */
export const deleteComment = async (req: any, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.userId;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId !== userId) return res.status(403).json({ message: 'Not your comment' });

    await prisma.comment.delete({ where: { id: commentId } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
