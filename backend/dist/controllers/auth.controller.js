"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyEmail = exports.forgotPassword = exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const logger = require("../utils/logger");
const mailer_1 = require("../utils/mailer");
const crypto_1 = __importDefault(require("crypto"));
// Реєстрація нового користувача
const register = async (req, res) => {
    try {
        const { username, displayname, email, password } = req.body;
        if (!username || !displayname || !email || !password) {
            return res.status(400).json({ message: "Всі поля обовʼязкові" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Пароль має бути не менше 6 символів" });
        }
        const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email вже використовується" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const verificationToken = require('crypto').randomBytes(32).toString('hex');
        const user = await prisma_1.default.user.create({
            data: { username, displayname, email, password: hashedPassword, verificationToken }
        });
        const verifyLink = `http://localhost:3000/auth/verify?token=${verificationToken}`;
        // await sendEmail(
        //   email,
        //   'Email Verification',
        //   `<p>To verify your email, click the link: <a href="${verifyLink}">${verifyLink}</a></p>`
        // );
        console.log('Email для підтвердження:', verifyLink);
        res.status(201).json({ message: "Користувача зареєстровано. Перевірте email для підтвердження акаунта." });
    }
    catch (error) {
        logger.error(error);
        res.status(500).json({ message: "Помилка сервера" });
    }
};
exports.register = register;
// Вхід
const login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body; // rememberMe — галочка "Запамʼятати мене"
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        // Знайти користувача за email
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        // Перевірка пароля
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        // JWT токен
        const secret = process.env.JWT_SECRET;
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, secret, { expiresIn: '7d' });
        // Зберегти токен у cookie
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000 // 30 днів або 7 днів
        });
        res.status(200).json({ message: 'Login successful', userId: user.id });
    }
    catch (error) {
        logger.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.login = login;
// Вихід
const logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logout successful' });
};
exports.logout = logout;
// Запит на скидання пароля
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    await prisma_1.default.user.update({
        where: { email },
        data: { resetToken }
    });
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    await (0, mailer_1.sendEmail)(email, 'Password Reset', `<p>To reset your password, click the link: <a href="${resetLink}">${resetLink}</a></p>`);
    res.json({ message: 'Password reset email sent' });
};
exports.forgotPassword = forgotPassword;
// Підтвердження електронної пошти
const verifyEmail = async (req, res) => {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: 'Invalid token' });
    }
    const user = await prisma_1.default.user.findUnique({ where: { verificationToken: token } });
    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
    }
    await prisma_1.default.user.update({
        where: { id: user.id },
        data: { isVerified: true, verificationToken: null }
    });
    res.json({ message: 'Email successfully verified!' });
};
exports.verifyEmail = verifyEmail;
// Скидання пароля
const resetPassword = async (req, res) => {
    const { email, token, newPassword } = req.body;
    const user = await prisma_1.default.user.findUnique({ where: { email }, select: { resetToken: true, email: true } });
    if (!user || user.resetToken !== token) {
        return res.status(400).json({ message: 'Invalid token or email' });
    }
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
    await prisma_1.default.user.update({
        where: { email },
        data: { password: hashedPassword, resetToken: null }
    });
    res.json({ message: 'Password reset successful' });
};
exports.resetPassword = resetPassword;
