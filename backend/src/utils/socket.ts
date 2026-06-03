import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

let io: Server;

function parseCookies(cookieHeader: string): Record<string, string> {
  const result: Record<string, string> = {};
  cookieHeader.split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx < 0) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    try { result[key] = decodeURIComponent(val); } catch { result[key] = val; }
  });
  return result;
}

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.use((socket: any, next) => {
    try {
      const authToken = socket.handshake.auth?.token;
      const cookieHeader = socket.handshake.headers.cookie || '';
      const cookies = parseCookies(cookieHeader);
      const token = authToken || cookies.token;
      if (!token) return next(new Error('Authentication required'));

      const secret = process.env.JWT_SECRET as string;
      const decoded = jwt.verify(token, secret) as { userId: string };
      socket.data.userId = decoded.userId;          
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: any) => {
    const userId: string = socket.data.userId;

    socket.join(userId);

    socket.on('register', (claimedId: string) => {
      if (claimedId === userId) {
      
        socket.join(userId);
      }
    });

  });

  return io;
}

export function getIo() { return io; }

export function isUserOnline(userId: string): boolean {
  if (!io) return false;
  const room = io.sockets.adapter.rooms.get(userId);
  return !!room && room.size > 0;
}

export function getUserSockets() {
  return {
    get: (userId: string): string | null =>
      isUserOnline(userId) ? userId : null,
  } as unknown as Map<string, string>;
}
