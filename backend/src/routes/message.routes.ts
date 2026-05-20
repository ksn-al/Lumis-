import { Router } from "express";
import { getConversations, getMessages, sendMessage, createConversationAndSendMessage } from "../controllers/message.controller";
import {authMiddleware} from "../middleware/auth.middleware";

const router = Router();

router.post("/new", authMiddleware, createConversationAndSendMessage);
// Получить все чаты пользователя
router.get("/conversations", authMiddleware, getConversations);

// Получить все сообщения в переписке
router.get("/conversations/:conversationId/messages", authMiddleware, getMessages);

// Отправить новое сообщение в переписку
router.post("/conversations/:conversationId/messages", authMiddleware, sendMessage);

export default router;
