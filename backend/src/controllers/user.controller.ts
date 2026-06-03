import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { getIo, getUserSockets } from "../utils/socket";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary";
const logger = require("../utils/logger");

const followInclude = {
  followers: {
    include: {
      follower: { select: { id: true, username: true, displayname: true, avatar: true } },
    },
  },
  following: {
    include: {
      following: { select: { id: true, username: true, displayname: true, avatar: true } },
    },
  },
};

function flattenFollows(user: any) {
  return {
    ...user,
    followers: user.followers.map((f: any) => f.follower),
    following: user.following.map((f: any) => f.following),
    followersCount: user.followers.length,
    followingCount: user.following.length,
  };
}

export const getMe = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayname: true,
        avatar: true,
        headerPhoto: true,
        isVerified: true,
        createdAt: true,
        googleId: true,
        ...followInclude,
        posts: {
          orderBy: { createdAt: 'desc' },
          include: {
            likes:     { select: { userId: true } },
            favorites: { select: { userId: true } },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = user.posts.map((post: any) => ({
      ...post,
      likesCount: post.likes.length,
      liked:      post.likes.some((l: any) => l.userId === userId),
      favorited:  post.favorites.some((f: any) => f.userId === userId),
    }));

    res.status(200).json({ user: { ...flattenFollows(user), posts } });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
    const viewerId: string | undefined = req.userId;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayname: true,
        avatar: true,
        headerPhoto: true,
        isVerified: true,
        createdAt: true,
        ...followInclude,
        posts: {
          orderBy: { createdAt: 'desc' },
          include: {
            likes:     { select: { userId: true } },
            favorites: { select: { userId: true } },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = user.posts.map((post: any) => ({
      ...post,
      likesCount: post.likes.length,
      liked:      viewerId ? post.likes.some((l: any) => l.userId === viewerId) : false,
      favorited:  viewerId ? post.favorites.some((f: any) => f.userId === viewerId) : false,
    }));

    res.status(200).json({ ...flattenFollows(user), posts, postsCount: user.posts.length });
  } catch (error) {
    logger.error('getProfile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { displayname, username } = req.body;

    // Fetch existing user to get old public_ids for deletion
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPublicId: true, headerPhotoPublicId: true },
    });

    const data: any = {};

    // Accept any non-empty, trimmed string (allows single-char values; rejects blanks)
    if (typeof displayname === 'string' && displayname.trim().length > 0) {
      data.displayname = displayname.trim();
    }

    if (typeof username === 'string' && username.trim().length > 0) {
      const trimmed = username.trim();
      // Only allow letters, digits, underscores (no spaces or special chars that break URL routing)
      if (!/^[a-zA-Z0-9_]{1,30}$/.test(trimmed)) {
        return res.status(400).json({ message: 'Username може містити лише літери, цифри та підкреслення (макс. 30 символів)' });
      }
      const taken = await prisma.user.findFirst({ where: { username: trimmed, NOT: { id: userId } } });
      if (taken) return res.status(400).json({ message: 'Username вже зайнятий' });
      data.username = trimmed;
    }

    // ── Avatar upload ──────────────────────────────────────────────────────
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    if (files?.avatar?.[0]) {
      // Delete old avatar from Cloudinary if it has a public_id
      await deleteFromCloudinary(existing?.avatarPublicId);

      const result = await uploadToCloudinary(files.avatar[0].buffer, 'lumis/avatars', {
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }],
      });
      data.avatar          = result.secure_url;
      data.avatarPublicId  = result.public_id;
    }

    // ── Header photo upload ────────────────────────────────────────────────
    if (files?.headerPhoto?.[0]) {
      await deleteFromCloudinary(existing?.headerPhotoPublicId);

      const result = await uploadToCloudinary(files.headerPhoto[0].buffer, 'lumis/headers', {
        transformation: [{ width: 1200, height: 400, crop: 'fill', quality: 'auto' }],
      });
      data.headerPhoto            = result.secure_url;
      data.headerPhotoPublicId    = result.public_id;
    }

    const user = await prisma.user.update({
      where:  { id: userId },
      data,
      select: {
        id: true, username: true, displayname: true,
        avatar: true, headerPhoto: true, isVerified: true, createdAt: true,
      },
    });
    res.status(200).json({ message: 'Profile updated', user });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const followUser = async (req: any, res: Response) => {
  try {
    const followerId = req.userId;
    const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
    const userToFollow = await prisma.user.findUnique({ where: { username } });
    if (!userToFollow) return res.status(404).json({ message: 'User not found' });
    if (userToFollow.id === followerId) return res.status(400).json({ message: 'Cannot follow yourself' });

    try {
      await prisma.follow.create({ data: { followerId, followingId: userToFollow.id } });
    } catch (err: any) {
      // P2002 = unique constraint — already following; treat as success
      if (err.code === 'P2002') {
        return res.status(200).json({ message: 'Already following' });
      }
      throw err;
    }

    // Notification + real-time socket
    try {
      const notification = await prisma.notification.create({
        data: { type: 'new_follower', userId: userToFollow.id, fromUserId: followerId },
      });
      const io = getIo();
      if (io) {
        const socketId = getUserSockets().get(userToFollow.id);
        if (socketId) {
          const fromUser = await prisma.user.findUnique({
            where: { id: followerId },
            select: { id: true, username: true, displayname: true, avatar: true },
          });
          io.to(socketId).emit('new-notification', {
            id:        notification.id,
            type:      'new_follower',
            fromUser,
            read:      false,
            createdAt: notification.createdAt.toISOString(),
          });
        }
      }
    } catch (err) {
      logger.error('Notification error on follow:', err);
    }

    res.status(201).json({ message: 'Followed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const unfollowUser = async (req: any, res: Response) => {
  try {
    const followerId = req.userId;
    const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
    const userToUnfollow = await prisma.user.findUnique({ where: { username } });
    if (!userToUnfollow) return res.status(404).json({ message: 'User not found' });
    await prisma.follow.deleteMany({ where: { followerId, followingId: userToUnfollow.id } });
    res.status(200).json({ message: 'Unfollowed' });
  } catch (error) {
    logger.error('unfollowUser error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const followers = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: { follower: { select: { id: true, username: true, displayname: true, avatar: true } } },
    });
    res.status(200).json(followers.map((f: any) => f.follower));
  } catch (error) {
    logger.error('getFollowers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getFollowing = async (req: Request, res: Response) => {
  try {
    const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      include: { following: { select: { id: true, username: true, displayname: true, avatar: true } } },
    });
    res.status(200).json(following.map((f: any) => f.following));
  } catch (error) {
    logger.error('getFollowing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length === 0) return res.status(400).json({ message: 'Query required' });
    if (query.length > 100) return res.status(400).json({ message: 'Query too long' });
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username:    { contains: query, mode: 'insensitive' } },
          { displayname: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, username: true, displayname: true, avatar: true },
      take:   50,
    });
    res.status(200).json(users);
  } catch (error) {
    logger.error('searchUsers error:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};
