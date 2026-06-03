import { Router } from "express";
import { getConversations, getMessages, sendMessage, createConversationAndSendMessage, getUnreadCount, markConversationRead } from "../controllers/message.controller";
import {authMiddleware} from "../middleware/auth.middleware";

const router = Router();

router.post("/new", authMiddleware, createConversationAndSendMessage);
// Непрочитанные сообщения (для бейджа)
router.get("/unread-count", authMiddleware, getUnreadCount);
// Получить все чаты пользователя
router.get("/conversations", authMiddleware, getConversations);

// Получить все сообщения в переписке
router.get("/conversations/:conversationId/messages", authMiddleware, getMessages);

// Пометить переписку как прочитанную
router.post("/conversations/:conversationId/read", authMiddleware, markConversationRead);

// Отправить новое сообщение в переписку
router.post("/conversations/:conversationId/messages", authMiddleware, sendMessage);

export default router;
