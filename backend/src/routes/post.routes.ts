import { Router } from 'express';
import {
  createPost,
  deletePost,
  likePost,
  getFeed,
  searchPosts,
  toggleFavorite,
  getFavorites,
} from '../controllers/post.controller';
import {
  getComments,
  createComment,
  likeComment,
  deleteComment,
} from '../controllers/comment.controller';
import { authMiddleware, optionalAuth } from '../middleware/auth.middleware';
import { uploadPostImage } from '../middleware/upload.middleware';

const router = Router();

router.get('/feed',      authMiddleware, getFeed);
router.get('/search',    searchPosts);
router.get('/favorites', authMiddleware, getFavorites);
router.post('/',         authMiddleware, uploadPostImage, createPost);
router.delete('/:id',    authMiddleware, deletePost);
router.post('/:id/like',     authMiddleware, likePost);
router.post('/:id/favorite', authMiddleware, toggleFavorite);

router.get('/:postId/comments',           optionalAuth,    getComments);
router.post('/:postId/comments',          authMiddleware,  createComment);
router.post('/comments/:commentId/like',  authMiddleware,  likeComment);
router.delete('/comments/:commentId',     authMiddleware,  deleteComment);

export default router;
