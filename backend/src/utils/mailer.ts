import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY as string;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL as string;

sgMail.setApiKey(SENDGRID_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
    const msg = {
        to,
        from: SENDGRID_FROM_EMAIL,
        subject,
        html,
    };
    await sgMail.send(msg);
}
