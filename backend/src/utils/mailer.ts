import https from 'https';
const logger = require('./logger');

const BREVO_API_KEY = process.env.BREVO_API_KEY as string;
const FROM_EMAIL    = process.env.FROM_EMAIL    as string;

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  // Dev fallback: if no API key configured, print to console
  if (!BREVO_API_KEY) {
    logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}\n${html}`);
    return;
  }

  const body = JSON.stringify({
    sender:      { name: 'Lumis', email: FROM_EMAIL },
    to:          [{ email: to }],
    subject,
    htmlContent: html,
  });

  return new Promise<void>((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.brevo.com',
        path:     '/v3/smtp/email',
        method:   'POST',
        headers:  {
          'api-key':       BREVO_API_KEY,
          'Content-Type':  'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
