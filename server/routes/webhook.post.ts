import { createHmac } from 'crypto';
import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const webhookKey = process.env.MAILGUN_HTTP_WEBHOOK_KEY;
  
  if (!webhookKey) {
    console.error('MAILGUN_HTTP_WEBHOOK_KEY is missing');
    return { status: 'error', message: 'Config error' };
  }

  // Mailgun sends multipart/form-data. readMultipartFormData returns an array of { name, data, filename, type }
  const body = await readMultipartFormData(event);
  
  if (!body) {
    throw createError({ statusCode: 400, message: 'Invalid body' });
  }

  // Helper to extract fields from multipart
  const fields: Record<string, string> = {};
  for (const part of body) {
    if (part.name) {
      fields[part.name] = part.data.toString('utf-8');
    }
  }

  const { signature, timestamp, token } = fields;

  if (!signature || !timestamp || !token) {
    console.error('Missing signature/timestamp/token', { signature, timestamp, token });
    return { status: 'error', message: 'Unauthorized' };
  }

  // 1. Verify signature
  const hmac = createHmac('sha256', webhookKey);
  hmac.update(timestamp + token);
  const calculatedSignature = hmac.digest('hex');

  // Comparison for security (though we'll use a simple one for now)
  if (calculatedSignature !== signature) {
    console.error('Signature mismatch', { calculated: calculatedSignature, received: signature });
    return { status: 'error', message: 'Invalid signature' };
  }

  // 2. Extract email content
  const recipient = fields.recipient || fields.To || '';
  const sender = fields.sender || fields.From || '';
  const subject = fields.subject || '(No Subject)';
  const bodyText = fields['body-plain'] || '';
  const bodyHtml = fields['body-html'] || '';

  // 3. Store in DB
  const db = useDb();
  const stmt = db.prepare(`
    INSERT INTO emails (to_address, from_address, subject, body_text, body_html, received_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    recipient.toLowerCase(),
    sender,
    subject,
    bodyText,
    bodyHtml,
    Date.now()
  );

  return { status: 'success' };
});
