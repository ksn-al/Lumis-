import { Router } from 'express';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  googleCallback,
} from '../controllers/auth.controller';

const router = Router();

const loginLimiter = rateLimit({
  windowMs:         60 * 1000,   
  max:              5,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { message: 'Too many login attempts. Please try again in 1 minute.' },
});

const registerLimiter = rateLimit({
  windowMs:         60 * 1000,
  max:              5,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { message: 'Too many registration attempts. Please try again in 1 minute.' },
});

const forgotPasswordLimiter = rateLimit({
  windowMs:         60 * 1000,
  max:              3,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { message: 'Too many password reset requests. Please try again in 1 minute.' },
});

router.post('/register',             registerLimiter,       register);
router.post('/login',                loginLimiter,          login);
router.post('/logout',               logout);
router.post('/forgot-password',      forgotPasswordLimiter, forgotPassword);
router.post('/reset-password',       resetPassword);
router.post('/resend-verification',  forgotPasswordLimiter, resendVerification);
router.get('/verify',                verifyEmail);

// Google OAuth2 
router.get(
  '/google',
  passport.authenticate('google', { scope: ['email', 'profile'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=oauth_failed`,
  }),
  googleCallback
);

export default router;
