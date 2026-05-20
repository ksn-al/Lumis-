import { Request, Response } from "express";
import prisma from "../utils/prisma";
const logger = require("../utils/logger");

// Получить текущего пользователя по id (для /users/me)
export const getMe = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    console.log("userId from token:", userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayname: true,
        avatar: true,
        headerPhoto: true,
        createdAt: true,
        followers: { select: { id: true } },
        following: { select: { id: true } },
        posts: {
          select: {
            id: true,
            text: true,
            image: true,
            createdAt: true,
            likes: { select: { userId: true } },
            favorites: { select: { userId: true } }
          }
        }
      }
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    //  likesCount, liked, favorited для каждого поста
    const posts = user.posts.map(post => ({
      ...post,
      likesCount: post.likes.length,
      liked: post.likes.some(like => like.userId === userId),
      favorited: post.favorites.some(fav => fav.userId === userId)
    }));
    res.status(200).json({
      user: {
        ...user,
        posts
      }
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
   
   




// Отримати профіль користувача за username
export const getProfile = async (req: Request, res: Response) => {
  try {
    const usernameRaw = req.params.username;
    const username = Array.isArray(usernameRaw) ? usernameRaw[0] : usernameRaw;
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayname: true,
        avatar: true,
        headerPhoto: true,
        createdAt: true,
        followers: { select: { id: true } },
        following: { select: { id: true } },
        posts: {
          select: {
            id: true,
            text: true,
            image: true,
            createdAt: true,
            likes: { select: { userId: true } },
            favorites: { select: { userId: true } }
          }
        }
      }
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Для профиля чужого пользователя: liked/favorited всегда false
    const posts = user.posts.map(post => ({
      ...post,
      likesCount: post.likes.length,
      liked: false,
      favorited: false
    }));
    res.status(200).json({
      ...user,
      posts,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      postsCount: user.posts.length
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Редагувати свій профіль
export const updateProfile = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { displayname, avatar, headerPhoto } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { displayname, avatar, headerPhoto }
    });
    res.status(200).json({ message: "Profile updated", user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Підписатися на користувача
export const followUser = async (req: any, res: Response) => {
  try {
    const followerId = req.userId;
    const usernameRaw = req.params.username;
    const username = Array.isArray(usernameRaw) ? usernameRaw[0] : usernameRaw;
    const userToFollow = await prisma.user.findUnique({ where: { username } });
    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }
    if (userToFollow.id === followerId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }
    await prisma.follow.create({
      data: { followerId, followingId: userToFollow.id }
    });
    res.status(201).json({ message: "Followed" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Відписатися від користувача
export const unfollowUser = async (req: any, res: Response) => {
  try {
    const followerId = req.userId;
    const usernameRaw = req.params.username;
    const username = Array.isArray(usernameRaw) ? usernameRaw[0] : usernameRaw;
    const userToUnfollow = await prisma.user.findUnique({ where: { username } });
    if (!userToUnfollow) {
      return res.status(404).json({ message: "User not found" });
    }
    await prisma.follow.deleteMany({
      where: { followerId, followingId: userToUnfollow.id }
    });
    res.status(200).json({ message: "Unfollowed" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Отримати список підписників
export const getFollowers = async (req: Request, res: Response) => {
  try {
    const usernameRaw = req.params.username;
    const username = Array.isArray(usernameRaw) ? usernameRaw[0] : usernameRaw;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const followers = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: { follower: { select: { username: true, displayname: true, avatar: true } } }
    });
    res.status(200).json(followers.map(f => f.follower));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Отримати список підписок
export const getFollowing = async (req: Request, res: Response) => {
  try {
    const usernameRaw = req.params.username;
    const username = Array.isArray(usernameRaw) ? usernameRaw[0] : usernameRaw;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      include: { following: { select: { username: true, displayname: true, avatar: true } } }
    });
    res.status(200).json(following.map(f => f.following));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//Пошук користувачів за username або displayname
export const searchUsers = async (req: Request, res: Response) => {
  try{
    const query = req.query.q as string;
    const users = await prisma.user.findMany({
      where: { 
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayname: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: { id: true, username: true, displayname: true, avatar: true }
    });
    res.status(200).json(users);
  } catch(error){
    res.status(500).json({message: 'Помилка сервера'})
}
}