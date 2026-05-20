import { Request, Response } from "express";
import prisma from "../utils/prisma";
const logger = require("../utils/logger");

// Отримати всі чати користувача
export const getConversations = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { id: userId } } },
      include: {
        participants: { select: { id: true, username: true, displayname: true, avatar: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });
    res.json(conversations);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Создать новый чат и отправить первое сообщение
export const createConversationAndSendMessage = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { to, text } = req.body;
    if (!to || !text) return res.status(400).json({ message: "to і text обов'язкові" });

    // Найти пользователя-получателя
    const receiver = await prisma.user.findUnique({ where: { username: to } });
    if (!receiver) return res.status(404).json({ message: "Користувач не знайдений" });

    // Проверить, есть ли уже чат между этими пользователями
    let conversation = await prisma.conversation.findFirst({
      where: {
        participants: { some: { id: userId } },
        AND: { participants: { some: { id: receiver.id } } }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: { connect: [{ id: userId }, { id: receiver.id }] }
        }
      });
    }

    // Создать сообщение
    const message = await prisma.message.create({
      data: {
        text,
        senderId: userId,
        receiverId: receiver.id,
        conversationId: conversation.id
      }
    });

    res.json({ conversation, message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Отримати всі повідомлення в переписці за conversationId
export const getMessages = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    // Перевірка, чи користувач є учасником переписки
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });
    if (!conversation || !conversation.participants.some((u: any) => u.id === userId)) {
      return res.status(403).json({ message: 'Немає доступу до цієї переписки' });
    }
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, username: true, displayname: true, avatar: true } },
        receiver: { select: { id: true, username: true, displayname: true, avatar: true } }
      }
    });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Надіслати нове повідомлення в переписку
export const sendMessage = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    const { text, receiverId } = req.body;
    if (!text || !receiverId) {
      return res.status(400).json({ message: 'Текст і отримувач обовʼязкові' });
    }
    // Перевірка, чи користувач є учасником переписки
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });
    if (!conversation || !conversation.participants.some((u: any) => u.id === userId)) {
      return res.status(403).json({ message: 'Немає доступу до цієї переписки' });
    }
    const message = await prisma.message.create({
      data: {
        text,
        senderId: userId,
        receiverId,
        conversationId
      }
    });
    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

