"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
mail_1.default.setApiKey(SENDGRID_API_KEY);
async function sendEmail(to, subject, html) {
    const msg = {
        to,
        from: SENDGRID_FROM_EMAIL,
        subject,
        html,
    };
    await mail_1.default.send(msg);
}
