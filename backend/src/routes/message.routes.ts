import { Router } from "express";
import { getConversations, getMessages, sendMessage, createConversationAndSendMessage, getUnreadCount, markConversationRead } from "../controllers/message.controller";
import {authMiddleware} from "../middleware/auth.middleware";

const router = Router();

router.post("/new", authMiddleware, createConversationAndSendMessage);

router.get("/unread-count", authMiddleware, getUnreadCount);

router.get("/conversations", authMiddleware, getConversations);

router.get("/conversations/:conversationId/messages", authMiddleware, getMessages);

router.post("/conversations/:conversationId/read", authMiddleware, markConversationRead);

router.post("/conversations/:conversationId/messages", authMiddleware, sendMessage);

export default router;
