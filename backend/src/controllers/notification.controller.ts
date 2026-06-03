import { Request, Response } from "express";
import prisma from "../utils/prisma";
const logger = require("../utils/logger");

export const getNotifications = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        fromUser: { select: { id: true, username: true, displayname: true, avatar: true } },
      },
    });
    res.json(notifications);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUnreadCount = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const count = await prisma.notification.count({ where: { userId, read: false } });
    res.json({ count });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markRead = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markAllRead = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    res.json({ message: 'All marked as read' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
