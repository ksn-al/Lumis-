import { Router } from 'express';
import {searchUsers, getProfile, updateProfile, followUser, unfollowUser, getFollowers, getFollowing, getMe } from '../controllers/user.controller';

import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();


router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateProfile);
router.get("/search", searchUsers);
router.get("/:username", getProfile);
router.post("/:username/follow", authMiddleware, followUser);
router.post("/:username/unfollow", authMiddleware, unfollowUser);
router.get("/:username/followers", getFollowers);
router.get("/:username/following", getFollowing);


export default router;