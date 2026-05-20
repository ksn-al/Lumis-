"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const post_controller_1 = require("../controllers/post.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload = (0, multer_1.default)({ dest: 'uploads/' });
const router = (0, express_1.Router)();
router.get('/feed', auth_middleware_1.authMiddleware, post_controller_1.getFeed);
router.get('/search', post_controller_1.searchPosts);
router.post('/', auth_middleware_1.authMiddleware, upload.single('image'), post_controller_1.createPost);
router.delete('/:id', auth_middleware_1.authMiddleware, post_controller_1.deletePost);
router.post('/:id/like', auth_middleware_1.authMiddleware, post_controller_1.likePost);
router.post('/:id/favorite', auth_middleware_1.authMiddleware, post_controller_1.toggleFavorite);
router.get('/favorites', auth_middleware_1.authMiddleware, post_controller_1.getFavorites);
exports.default = router;
