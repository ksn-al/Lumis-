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

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'none'"],           
      styleSrc:       ["'none'"],           
      imgSrc:         ["'self'", 'res.cloudinary.com', 'lh3.googleusercontent.com', 'data:'],                                  
      connectSrc:     ["'self'"],
      frameAncestors: ["'none'"],           
      formAction:     ["'self'", 'https://accounts.google.com'],
      objectSrc:      ["'none'"],
      baseUri:        ["'self'"],
      upgradeInsecureRequests: [],          
    },
  },

  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

initPassport();
app.use(passport.initialize());

app.use('/auth',          authRoutes);
app.use('/users',         userRoutes);
app.use('/posts',         postRoutes);
app.use('/messages',      messageRoutes);
app.use('/notifications', notificationRoutes);

app.get('/', (_req, res) => res.json({ message: 'Server is running!' }));

app.use((err: any, _req: any, res: any, _next: any) => {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ message });
});

initSocket(server);

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
