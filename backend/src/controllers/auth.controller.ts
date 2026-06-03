import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";
const logger = require("../utils/logger");
import { sendEmail } from '../utils/mailer';
import crypto from 'crypto';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ─── helpers ────────────────────────────────────────────────────────────────

function issueJwt(res: Response, userId: string, rememberMe = false) {
  const secret    = process.env.JWT_SECRET as string;
  const expiresIn = rememberMe ? '30d' : '7d';
  const maxAge    = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  const token     = jwt.sign({ userId }, secret, { expiresIn });

  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',   // 'none' required for cross-origin (Vercel→Render)
    secure:   isProd,                     // 'none' only works with secure:true
    maxAge,
  });
}

// ─── register ───────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response) => {
  try {
    const { username, displayname, email, password } = req.body;

    if (!username || !displayname || !email || !password) {
      return res.status(400).json({ message: "Всі поля обовʼязкові" });
    }
    if (!/^[a-zA-Z0-9_]{1,30}$/.test(username)) {
      return res.status(400).json({ message: "Username може містити лише літери, цифри та підкреслення (макс. 30 символів)" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Пароль має бути не менше 6 символів" });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email вже використовується" });
      }
      return res.status(400).json({ message: "Username вже зайнятий" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    // Verification link expires in 24 hours
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.create({
      data: {
        username,
        displayname,
        email,
        password: hashedPassword,
        verificationToken,
        verificationTokenExpiresAt,
      }
    });

    const verifyLink = `${CLIENT_URL}/auth/verify?token=${verificationToken}`;
    try {
      await sendEmail(email, 'Email Verification',
        `<p>To verify your email, click the link (valid for 24 hours):</p>
         <p><a href="${verifyLink}">${verifyLink}</a></p>`);
    } catch (emailErr) {
      logger.error('Email send failed:', emailErr);
    }

    res.status(201).json({ message: "Користувача зареєстровано. Перевірте email для підтвердження акаунта." });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Помилка сервера" });
  }
};

// ─── login ──────────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Google-only account – no password set
    if (!user.password) {
      return res.status(400).json({
        message: 'This account uses Google login. Please sign in with Google.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    issueJwt(res, user.id, rememberMe);
    res.status(200).json({ message: 'Login successful', userId: user.id });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── logout ─────────────────────────────────────────────────────────────────

export const logout = (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure:   isProd,
  });
  res.status(200).json({ message: 'Logout successful' });
};

// ─── forgot password ────────────────────────────────────────────────────────

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Always return the same response to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate a random token, store only its SHA-256 hash in the DB.
    // The plain token is sent in the email link and never persisted.
    const resetToken     = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    // Token expires in 1 hour
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data:  { resetToken: resetTokenHash, resetTokenExpiresAt },
    });

    const resetLink = `${CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    try {
      await sendEmail(email, 'Password Reset',
        `<p>To reset your password, click the link (valid for 1 hour):</p>
         <p><a href="${resetLink}">${resetLink}</a></p>`);
    } catch (emailErr) {
      logger.error('Password reset email failed:', emailErr);
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── verify email ───────────────────────────────────────────────────────────

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({ where: { verificationToken: token } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Verification link has expired. Please register again.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified:                  true,
        verificationToken:           null,
        verificationTokenExpiresAt:  null,
      },
    });

    res.json({ message: 'Email successfully verified!' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── resend verification ────────────────────────────────────────────────────

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Always return the same response to prevent user enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.isVerified) {
      return res.json({ message: 'If that email exists and is unverified, a new link has been sent.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data:  { verificationToken, verificationTokenExpiresAt },
    });

    const verifyLink = `${CLIENT_URL}/auth/verify?token=${verificationToken}`;
    try {
      await sendEmail(email, 'Email Verification',
        `<p>To verify your email, click the link (valid for 24 hours):</p>
         <p><a href="${verifyLink}">${verifyLink}</a></p>`);
    } catch (emailErr) {
      logger.error('Resend verification email failed:', emailErr);
    }

    res.json({ message: 'If that email exists and is unverified, a new link has been sent.' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── reset password ─────────────────────────────────────────────────────────

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'Всі поля обовʼязкові' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Пароль має бути не менше 6 символів' });
    }

    // Hash the incoming plain token and compare against the stored hash.
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findUnique({
      where:  { email },
      select: { resetToken: true, resetTokenExpiresAt: true, email: true },
    });

    if (!user || !user.resetToken || user.resetToken !== tokenHash) {
      return res.status(400).json({ message: 'Invalid token or email' });
    }

    // Reject expired tokens
    if (user.resetTokenExpiresAt && user.resetTokenExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Reset link has expired. Please request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data:  {
        password:            hashedPassword,
        resetToken:          null,
        resetTokenExpiresAt: null,
      },
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Google OAuth callback ───────────────────────────────────────────────────

export const googleCallback = (req: any, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.redirect(`${CLIENT_URL}/login?error=oauth_failed`);

    issueJwt(res, user.id, false);
    res.redirect(`${CLIENT_URL}/feed`);
  } catch (err) {
    logger.error('Google OAuth callback error:', err);
    res.redirect(`${CLIENT_URL}/login?error=oauth_failed`);
  }
};
