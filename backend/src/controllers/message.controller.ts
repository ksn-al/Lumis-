import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { getIo, getUserSockets } from "../utils/socket";
const logger = require("../utils/logger");

const msgInclude = {
  sender:   { select: { id: true, username: true, displayname: true, avatar: true } },
  receiver: { select: { id: true, username: true, displayname: true, avatar: true } },
};

function emitNewMessage(receiverId: string, message: any) {
  try {
    const io = getIo();
    if (!io) return;
    const socketId = getUserSockets().get(receiverId);
    if (socketId) io.to(socketId).emit('new-message', message);
  } catch (err) {
    logger.error('Socket emit error:', err);
  }
}

/**
 * Persist a new_message notification AND push it in real-time via socket.
 * senderInfo is the sender object already fetched from the message include.
 */
async function createMessageNotification(
  senderId: string,
  receiverId: string,
  conversationId: string,
  senderInfo?: { id: string; username: string; displayname: string; avatar: string | null } | null
) {
  try {
    if (senderId === receiverId) return;

    const notification = await prisma.notification.create({
      data: { type: 'new_message', userId: receiverId, fromUserId: senderId, conversationId },
    });

    // ── Real-time push ──────────────────────────────────────────────────────
    const io = getIo();
    if (io) {
      io.to(receiverId).emit('new-notification', {
        id:             notification.id,
        type:           'new_message',
        fromUser:       senderInfo ?? null,
        conversationId,
        read:           false,
        createdAt:      notification.createdAt.toISOString(),
      });
    }
  } catch (err) {
    logger.error('Notification create error:', err);
  }
}

export const getConversations = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { id: userId } } },
      include: {
        participants: { select: { id: true, username: true, displayname: true, avatar: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(conversations);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createConversationAndSendMessage = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { to, text } = req.body;
    if (!to || !text) return res.status(400).json({ message: "to і text обов'язкові" });

    const receiver = await prisma.user.findUnique({ where: { username: to } });
    if (!receiver) return res.status(404).json({ message: 'Користувач не знайдений' });

    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: userId } } },
          { participants: { some: { id: receiver.id } } },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: { connect: [{ id: userId }, { id: receiver.id }] },
        },
      });
    }

    const message = await prisma.message.create({
      data: { text, senderId: userId, receiverId: receiver.id, conversationId: conversation.id },
      include: msgInclude,
    });

    // Real-time delivery
    emitNewMessage(receiver.id, message);
    await createMessageNotification(userId, receiver.id, conversation.id, message.sender);

    res.json({ conversation, message });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMessages = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    // Cursor-based pagination: `before` is an ISO timestamp string.
    // Omit it for the initial load (returns the most-recent `limit` messages).
    // Pass it to load older messages above the oldest currently visible one.
    const before = req.query.before as string | undefined;
    const limit  = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });
    if (!conversation || !conversation.participants.some((u: any) => u.id === userId)) {
      return res.status(403).json({ message: 'Немає доступу до цієї переписки' });
    }

    // Fetch one extra to detect whether more pages exist
    const raw = await prisma.message.findMany({
      where: {
        conversationId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      orderBy: { createdAt: 'desc' },   // newest-first from DB
      take:    limit + 1,
      include: msgInclude,
    });

    const hasMore = raw.length > limit;
    if (hasMore) raw.pop();              // drop the sentinel extra record
    raw.reverse();                       // oldest-first for display

    // The cursor the client sends on the next "load older" call
    const nextCursor = hasMore ? raw[0].createdAt.toISOString() : null;

    res.json({ messages: raw, nextCursor });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendMessage = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!text) return res.status(400).json({ message: 'Текст обовʼязковий' });

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });
    if (!conversation || !conversation.participants.some((u: any) => u.id === userId)) {
      return res.status(403).json({ message: 'Немає доступу до цієї переписки' });
    }

    const receiver = conversation.participants.find((u: any) => u.id !== userId);
    if (!receiver) return res.status(400).json({ message: 'Отримувача не знайдено' });

    const message = await prisma.message.create({
      data: { text, senderId: userId, receiverId: receiver.id, conversationId },
      include: msgInclude,
    });

    // Real-time delivery
    emitNewMessage(receiver.id, message);
    await createMessageNotification(userId, receiver.id, conversationId, message.sender);

    res.status(201).json(message);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Unread message count (for sidebar badge) ─────────────────────────────────

export const getUnreadCount = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const count = await prisma.message.count({
      where: { receiverId: userId, isRead: false },
    });
    res.json({ count });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Mark all messages in a conversation as read ───────────────────────────────

export const markConversationRead = async (req: any, res: Response) => {
  try {
    const userId         = req.userId;
    const { conversationId } = req.params;

    await prisma.message.updateMany({
      where: { conversationId, receiverId: userId, isRead: false },
      data:  { isRead: true },
    });

    res.json({ ok: true });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
