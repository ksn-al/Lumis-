import { Router } from 'express';
import multer from 'multer';
import {
	createPost,
	deletePost,
	likePost,
	getFeed,
	searchPosts,
	toggleFavorite,
	getFavorites
} from '../controllers/post.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.get('/feed', authMiddleware, getFeed);
router.get('/search', searchPosts);
router.post('/', authMiddleware, upload.single('image'), createPost);
router.delete('/:id', authMiddleware, deletePost);
router.post('/:id/like', authMiddleware, likePost);
router.post('/:id/favorite', authMiddleware, toggleFavorite);
router.get('/favorites', authMiddleware, getFavorites);

export default router;