import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { getIo } from "../utils/socket";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary";
const logger = require("../utils/logger");

const postSelect = {
  user:      { select: { id: true, username: true, displayname: true, avatar: true } },
  likes:     { select: { userId: true } },
  favorites: { select: { userId: true } },
};

function withMeta(post: any, userId: string) {
  return {
    ...post,
    likesCount: post.likes.length,
    liked:      post.likes.some((l: any) => l.userId === userId),
    favorited:  post.favorites.some((f: any) => f.userId === userId),
  };
}

export const createPost = async (req: any, res: Response) => {
  try {
    const { text } = req.body;
    const userId   = req.userId;

    if (!text || text.length > 280) {
      return res.status(400).json({ message: 'Text is required and must be ≤ 280 characters' });
    }

    let imageUrl:      string | null = null;
    let imagePublicId: string | null = null;

    if (req.file?.buffer) {
      const result = await uploadToCloudinary(req.file.buffer, 'lumis/posts', {
        transformation: [{ width: 1200, quality: 'auto', fetch_format: 'auto' }],
      });
      imageUrl      = result.secure_url;
      imagePublicId = result.public_id;
    }

    const post = await prisma.post.create({
      data: { text, userId, image: imageUrl, imagePublicId },
      include: postSelect,
    });

    const enriched = withMeta(post, userId);
    res.status(201).json({ message: 'Post created successfully', post: enriched });

    
    setImmediate(async () => {
      try {
        const followers = await prisma.follow.findMany({
          where:  { followingId: userId },
          select: { followerId: true },
        });
        if (followers.length === 0) return;

        await prisma.notification.createMany({
          data: followers.map(f => ({
            type:       'new_post',
            userId:     f.followerId,
            fromUserId: userId,
            postId:     post.id,
          })),
          skipDuplicates: true,
        });

        const io = getIo();
        if (!io) return;

        for (const f of followers) {
          io.to(f.followerId).emit('new-post', enriched);
          io.to(f.followerId).emit('new-notification', {
            type:     'new_post',
            fromUser: enriched.user,
            postId:   post.id,
          });
        }
      } catch (err) {
        logger.error('Post notification error:', err);
      }
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePost = async (req: any, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.userId;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post)              return res.status(404).json({ message: 'Post not found' });
    if (post.userId !== userId) return res.status(403).json({ message: 'Not your post' });

    await deleteFromCloudinary(post.imagePublicId);

    await prisma.post.delete({ where: { id: postId } });
    res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const likePost = async (req: any, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.userId;
    const existing = await prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });
    if (existing) {
      await prisma.like.delete({ where: { userId_postId: { userId, postId } } });
      return res.status(200).json({ message: 'Post unliked' });
    }
    await prisma.like.create({ data: { userId, postId } });

    
    try {
      const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
      if (post && post.userId !== userId) {
        const notification = await prisma.notification.create({
          data: { type: 'new_like', userId: post.userId, fromUserId: userId, postId },
        });
        const io = getIo();
        if (io) {
          const fromUser = await prisma.user.findUnique({
            where:  { id: userId },
            select: { id: true, username: true, displayname: true, avatar: true },
          });
          io.to(post.userId).emit('new-notification', {
            id:        notification.id,
            type:      'new_like',
            fromUser,
            postId,
            read:      false,
            createdAt: notification.createdAt.toISOString(),
          });
        }
      }
    } catch (err) {
      logger.error('Notification error on like:', err);
    }

    res.status(201).json({ message: 'Liked' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getFeed = async (req: any, res: Response) => {
  try {
    const userId = req.userId;

 
    const before = req.query.before as string | undefined;
    const limit  = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const follows = await prisma.follow.findMany({
      where:  { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = follows.map((f: any) => f.followingId);
    followingIds.push(userId);

    const raw = await prisma.post.findMany({
      where: {
        userId: { in: followingIds },
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take:    limit + 1,           
      include: postSelect,
    });

    const hasMore = raw.length > limit;
    if (hasMore) raw.pop();       

    
    const nextCursor = hasMore ? raw[raw.length - 1].createdAt.toISOString() : null;

    res.status(200).json({ posts: raw.map((p: any) => withMeta(p, userId)), nextCursor });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchPosts = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (typeof q !== 'string' || q.length === 0 || q.length > 100) {
      return res.status(400).json({ message: 'Query is required and must be under 100 characters' });
    }
    const posts = await prisma.post.findMany({
      where:   { text: { contains: q, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
      take:    50,
      include: postSelect,
    });
    res.status(200).json(posts.map((p: any) => withMeta(p, '')));
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const toggleFavorite = async (req: any, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.userId;
    const existing = await prisma.favorite.findUnique({ where: { userId_postId: { userId, postId } } });
    if (existing) {
      await prisma.favorite.delete({ where: { userId_postId: { userId, postId } } });
      return res.status(200).json({ message: 'Пост видалено з вибраного' });
    }
    await prisma.favorite.create({ data: { userId, postId } });
    res.status(201).json({ message: 'Пост додано до вибраного' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getFavorites = async (req: any, res: Response) => {
  try {
    const userId   = req.userId;
    const favorites = await prisma.favorite.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      include: { post: { include: postSelect } },
    });
    const posts = favorites.map((fav: any) => withMeta({ ...fav.post, favorited: true }, userId));
    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
