import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

let io: Server;

// ── Cookie helper (no extra dependency) ──────────────────────────────────────
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

  // ── Authentication middleware ────────────────────────────────────────────
  // Every socket connection must present a valid JWT (via cookie).
  // The verified userId is attached to socket.data.userId — no client-supplied
  // userId is ever trusted.
  io.use((socket: any, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || '';
      const cookies = parseCookies(cookieHeader);
      const token = cookies.token;
      if (!token) return next(new Error('Authentication required'));

      const secret = process.env.JWT_SECRET as string;
      const decoded = jwt.verify(token, secret) as { userId: string };
      socket.data.userId = decoded.userId;          // verified — never trust client
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection handler ───────────────────────────────────────────────────
  io.on('connection', (socket: any) => {
    const userId: string = socket.data.userId;

    // Auto-join the user's private room immediately — no client prompt needed.
    socket.join(userId);

    // Keep backward-compat: clients still emit 'register' but we validate the
    // claimed userId against the authenticated one before joining any room.
    socket.on('register', (claimedId: string) => {
      if (claimedId === userId) {
        // Already joined above; re-joining is a no-op in socket.io.
        socket.join(userId);
      }
      // Mismatched id → silently ignored; attacker cannot subscribe to
      // another user's room.
    });

    // Cleanup is automatic — socket.io removes sockets from rooms on disconnect.
  });

  return io;
}

// ── Exports ──────────────────────────────────────────────────────────────────

export function getIo() { return io; }

/**
 * Returns true when userId has at least one active socket connection.
 * Used to skip expensive DB queries (fromUser lookup) for offline users.
 */
export function isUserOnline(userId: string): boolean {
  if (!io) return false;
  const room = io.sockets.adapter.rooms.get(userId);
  return !!room && room.size > 0;
}

/**
 * Backward-compatible shim for existing callers that do:
 *   const socketId = getUserSockets().get(userId);
 *   if (socketId) io.to(socketId).emit(...)
 *
 * Now returns the userId string (== room name) when online, null when offline.
 * The `if (socketId)` guard is therefore truthful again — offline users are skipped.
 */
export function getUserSockets() {
  return {
    get: (userId: string): string | null =>
      isUserOnline(userId) ? userId : null,
  } as unknown as Map<string, string>;
}
