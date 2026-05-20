"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFavorites = exports.toggleFavorite = exports.searchPosts = exports.getFeed = exports.likePost = exports.deletePost = exports.createPost = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const logger = require("../utils/logger");
// Створення нового поста
const createPost = async (req, res) => {
    try {
        const { text } = req.body;
        const userId = req.userId;
        let imageUrl = null;
        if (req.file) {
            // Можно доработать: сохранять оригинальное имя, делать resize, загружать в облако и т.д.
            imageUrl = `/uploads/${req.file.filename}`;
        }
        if (!text || text.length > 280) {
            return res.status(400).json({ message: 'Text is required and should be less than 280 characters' });
        }
        const post = await prisma_1.default.post.create({
            data: { text, userId, image: imageUrl }
        });
        res.status(201).json({ message: 'Post created successfully', post });
    }
    catch (error) {
        logger.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createPost = createPost;
// Видалення поста користувачем
const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.userId;
        const post = await prisma_1.default.post.findUnique({ where: { id: postId } });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (post.userId !== userId) {
            return res.status(403).json({ message: "Not your post" });
        }
        await prisma_1.default.post.delete({ where: { id: postId } });
        res.status(200).json({ message: "Post deleted" });
    }
    catch (error) {
        logger.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deletePost = deletePost;
// Лайк або анлайк поста
const likePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.userId;
        const existing = await prisma_1.default.like.findUnique({ where: { userId_postId: { userId, postId } } });
        if (existing) {
            await prisma_1.default.like.delete({ where: { userId_postId: { userId, postId } } });
            return res.status(200).json({ message: 'Post unliked' });
        }
        await prisma_1.default.like.create({ data: { userId, postId } });
        res.status(201).json({ message: 'Liked' });
    }
    catch (error) {
        logger.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.likePost = likePost;
// Отримати стрічку постів для користувача
const getFeed = async (req, res) => {
    try {
        const userId = req.userId;
        const follows = await prisma_1.default.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        const followingIds = follows.map((f) => f.followingId);
        followingIds.push(userId);
        const posts = await prisma_1.default.post.findMany({
            where: { userId: { in: followingIds } },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, username: true, displayname: true, avatar: true } },
                likes: true,
            }
        });
        res.status(200).json({ posts });
    }
    catch (error) {
        logger.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getFeed = getFeed;
// Пошук постів за текстом
const searchPosts = async (req, res) => {
    try {
        const { q } = req.query;
        if (typeof q !== 'string' || q.length === 0 || q.length > 100) {
            return res.status(400).json({ message: "Query is required and must be under 100 characters" });
        }
        const posts = await prisma_1.default.post.findMany({
            where: { text: { contains: q, mode: "insensitive" } },
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { id: true, username: true, displayname: true, avatar: true } },
                likes: true,
            },
        });
        res.status(200).json(posts);
    }
    catch (error) {
        logger.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.searchPosts = searchPosts;
//Вибране 
const toggleFavorite = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.userId;
        const existing = await prisma_1.default.favorite.findUnique({ where: { userId_postId: { userId, postId } } });
        if (existing) {
            await prisma_1.default.favorite.delete({ where: { userId_postId: { userId, postId } } });
            return res.status(200).json({ message: 'Пост видалено з вибраного' });
        }
        await prisma_1.default.favorite.create({ data: { userId, postId } });
        res.status(201).json({ message: 'Пост додано до вибраного' });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.toggleFavorite = toggleFavorite;
// Отримати вибране користувача 
const getFavorites = async (req, res) => {
    try {
        const userId = req.userId;
        const favorites = await prisma_1.default.favorite.findMany({
            where: { userId },
            include: {
                post: {
                    include: {
                        user: { select: { id: true, username: true, displayname: true, avatar: true } }
                    }
                }
            }
        });
        const posts = favorites.map((fav) => fav.post);
        res.status(200).json({ posts });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
exports.getFavorites = getFavorites;
