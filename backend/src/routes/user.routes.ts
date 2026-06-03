import { Router } from 'express';
import {
  searchUsers,
  getProfile,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getMe,
} from '../controllers/user.controller';
import { authMiddleware, optionalAuth } from '../middleware/auth.middleware';
import { uploadProfileImages } from '../middleware/upload.middleware';

const router = Router();

router.get('/me',                   authMiddleware, getMe);
router.put('/me',                   authMiddleware, uploadProfileImages, updateProfile);
router.get('/search',               searchUsers);
router.get('/:username',            optionalAuth, getProfile);
router.post('/:username/follow',    authMiddleware, followUser);
router.post('/:username/unfollow',  authMiddleware, unfollowUser);
router.get('/:username/followers',  getFollowers);
router.get('/:username/following',  getFollowing);

export default router;
