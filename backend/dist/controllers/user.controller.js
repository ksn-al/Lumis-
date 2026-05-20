"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsers = exports.getFollowing = exports.getFollowers = exports.unfollowUser = exports.followUser = exports.updateProfile = exports.getProfile = exports.getMe = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const logger = require("../utils/logger");
// Получить текущего пользователя по id (для /users/me)
const getMe = async (req, res) => {
    try {
        const userId = req.userId;
        console.log("userId from token:", userId);
        const user = await prisma_1.default.user.findUnique({
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
        const posts = user.posts.map((post) => ({
            ...post,
            likesCount: post.likes.length,
            liked: post.likes.some((like) => like.userId === userId),
            favorited: post.favorites.some((fav) => fav.userId === userId)
        }));
        res.status(200).json({
            user: {
                ...user,
                posts
            }
        });
    }
    catch (error) {
        logger.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getMe = getMe;
// Отримати профіль користувача за username
const getProfile = async (req, res) => {
    try {
        const usernameRaw = req.params.username;
        const username = Array.isArray(usernameRaw) ? usernameRaw[0] : usernameRaw;
        const user = await prisma_1.default.user.findUnique({
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
        const posts = user.posts.map((post) => ({
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
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getProfile = getProfile;
// Редагувати свій профіль
const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { displayname, avatar, headerPhoto } = req.body;
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: { displayname, avatar, headerPhoto }
        });
        res.status(200).json({ message: "Profile updated", user });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.updateProfile = updateProfile;
// Підписатися на користувача
const followUser = async (req, res) => {
    try {
        const followerId = req.userId;
        const usernameRaw = req.params.username;
        const username = Array.isArray(usernameRaw) ? usernameRaw[0] : usernameRaw;
        const userToFollow = await prisma_1.default.user.findUnique({ where: { username } });
        if (!userToFollow) {
            return res.status(404).json({ message: "User not found" });
        }
        if (userToFollow.id === followerId) {
            return res.status(400).json({ message: "Cannot follow yourself" });
        }
        await prisma_1.default.follow.create({
            data: { followerId, followingId: userToFollow.id }
        });
        res.status(201).json({ message: "Followed" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.followUser = followUser;
// Відписатися від користувача
const unfollowUser = async (req, res) => {
    try {
        const followerId = req.userId;
        const usernameRaw = req.params.username;
        const username = Array.isArray(usernameRaw) ? usernameRaw[0] : usernameRaw;
        const userToUnfollow = await prisma_1.default.user.findUnique({ where: { username } });
        if (!userToUnfollow) {
            return res.status(404).json({ message: "User not found" });
        }
        await prisma_1.default.follow.deleteMany({
            where: { followerId, followingId: userToUnfollow.id }
        });
        res.status(200).json({ message: "Unfollowed" });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.unfollowUser = unfollowUser;
// Отримати список підписників
const getFollowers = async (req, res) => {
    try {
        const usernameRaw = req.params.username;
        const username = Array.isArray(usernameRaw) ? usernameRaw[0] : usernameRaw;
        const user = await prisma_1.default.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const followers = await prisma_1.default.follow.findMany({
            where: { followingId: user.id },
            include: { follower: { select: { username: true, displayname: true, avatar: true } } }
        });
        res.status(200).json(followers.map((f) => f.follower));
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getFollowers = getFollowers;
// Отримати список підписок
const getFollowing = async (req, res) => {
    try {
        const usernameRaw = req.params.username;
        const username = Array.isArray(usernameRaw) ? usernameRaw[0] : usernameRaw;
        const user = await prisma_1.default.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const following = await prisma_1.default.follow.findMany({
            where: { followerId: user.id },
            include: { following: { select: { username: true, displayname: true, avatar: true } } }
        });
        res.status(200).json(following.map((f) => f.following));
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getFollowing = getFollowing;
//Пошук користувачів за username або displayname
const searchUsers = async (req, res) => {
    try {
        const query = req.query.q;
        const users = await prisma_1.default.user.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { displayname: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: { id: true, username: true, displayname: true, avatar: true }
        });
        res.status(200).json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Помилка сервера' });
    }
};
exports.searchUsers = searchUsers;
