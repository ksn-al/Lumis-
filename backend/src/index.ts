import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import passport from 'passport';
import helmet from 'helmet';

import authRoutes         from './routes/auth.routes';
import postRoutes         from './routes/post.routes';
import userRoutes         from './routes/user.routes';
import messageRoutes      from './routes/message.routes';
import notificationRoutes from './routes/notification.routes';

import { initSocket }   from './utils/socket';
import { initPassport } from './utils/passport';

dotenv.config();

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 5000;

// ── Security headers (helmet) ────────────────────────────────────────────────
// Applied before all other middleware so every response — including error
// responses from rate-limiters — gets the full header set.
app.use(helmet({
  // ── Content-Security-Policy ─────────────────────────────────────────────
  // This is an API-only server; no HTML is server-rendered.
  // CSP is therefore mainly advisory — it protects the handful of navigable
  // responses (health-check, OAuth redirect pages) from XSS / injection.
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'none'"],           // no scripts are ever served
      styleSrc:       ["'none'"],           // no stylesheets served
      imgSrc:         ["'self'", 'res.cloudinary.com', 'lh3.googleusercontent.com', 'data:'],
                                            // Cloudinary CDN + Google profile photos
      connectSrc:     ["'self'"],
      frameAncestors: ["'none'"],           // deny all iframe embedding
      formAction:     ["'self'", 'https://accounts.google.com'],
                                            // allow Google OAuth form posts
      objectSrc:      ["'none'"],
      baseUri:        ["'self'"],
      upgradeInsecureRequests: [],          // omit in dev; safe to include
    },
  },

  // ── Cross-Origin-Embedder-Policy ────────────────────────────────────────
  // Disabled — COEP: require-corp can interfere with Socket.io's HTTP
  // long-polling transport in some browser/proxy configurations.
  crossOriginEmbedderPolicy: false,

  // ── Cross-Origin-Resource-Policy ────────────────────────────────────────
  // cross-origin so the React SPA at :3000 can load resources served from
  // this backend (e.g. legacy /uploads static files loaded in <img> tags).
  // Without this, the browser would block cross-origin no-cors <img> loads.
  crossOriginResourcePolicy: { policy: 'cross-origin' },

  // ── All remaining helmet defaults are left enabled ───────────────────────
  //  X-Content-Type-Options: nosniff          → prevents MIME sniffing
  //  X-Frame-Options: SAMEORIGIN              → redundant with CSP above but kept
  //  Strict-Transport-Security: max-age=...   → enforces HTTPS in production
  //  Referrer-Policy: no-referrer             → no referrer leakage
  //  X-DNS-Prefetch-Control: off              → reduces DNS side-channel info
  //  X-Permitted-Cross-Domain-Policies: none  → blocks Adobe/Silverlight access
  //  X-Download-Options: noopen               → IE-era protection, harmless
}));

// ── Core middleware ──────────────────────────────────────────────────────────
// CORS must come after helmet so its Access-Control-* headers are added on
// top of helmet's security headers without conflict.
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// ── Static files (legacy local uploads — keep for backward compat) ───────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Passport ─────────────────────────────────────────────────────────────────
initPassport();
app.use(passport.initialize());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth',          authRoutes);
app.use('/users',         userRoutes);
app.use('/posts',         postRoutes);
app.use('/messages',      messageRoutes);
app.use('/notifications', notificationRoutes);

app.get('/', (_req, res) => res.json({ message: 'Server is running!' }));

// ── Global error handler ──────────────────────────────────────────────────────
// Must be after all routes. Catches multer rejections, Prisma errors, etc.
// Returns JSON instead of Express's default HTML error page.
app.use((err: any, _req: any, res: any, _next: any) => {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ message });
});

// ── Socket.io ─────────────────────────────────────────────────────────────────
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
