"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_controller_1 = require("../controllers/message.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/new", auth_middleware_1.authMiddleware, message_controller_1.createConversationAndSendMessage);
// Получить все чаты пользователя
router.get("/conversations", auth_middleware_1.authMiddleware, message_controller_1.getConversations);
// Получить все сообщения в переписке
router.get("/conversations/:conversationId/messages", auth_middleware_1.authMiddleware, message_controller_1.getMessages);
// Отправить новое сообщение в переписку
router.post("/conversations/:conversationId/messages", auth_middleware_1.authMiddleware, message_controller_1.sendMessage);
exports.default = router;
