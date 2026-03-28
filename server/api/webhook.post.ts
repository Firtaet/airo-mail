import crypto from 'node:crypto';
import { getEmailsDB, saveEmailsDB, verifyMailgunSignature } from '../utils/email';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    let data: any = {};
    
    // Check if it's multipart
    const contentType = getRequestHeader(event, 'content-type') || '';
    if (contentType.includes('multipart/form-data')) {
        const formData = await readMultipartFormData(event);
        if (formData) {
            for (const field of formData) {
                if (field.name) {
                    data[field.name] = field.data.toString();
                }
            }
        }
    } else {
        data = await readBody(event);
    }

    if (!data || Object.keys(data).length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'Empty payload' });
    }

    // Verify signature
    const { token, timestamp, signature } = data;
    if (!token || !timestamp || !signature) {
        throw createError({ statusCode: 401, message: 'Missing signature fields' });
    }

    const signingKey = config.mailgunWebhookKey;
    if (!verifyMailgunSignature(token, timestamp, signature, signingKey)) {
        throw createError({ statusCode: 401, message: 'Invalid signature' });
    }

    const from = data.from;
    const recipient = String(data.recipient || '').toLowerCase();
    const subject = data.subject || '(No Subject)';
    const bodyPlain = data['stripped-text'] || data['body-plain'] || '(No Content)';
    const bodyHtml = data['stripped-html'] || data['body-html'];
    
    if (!recipient) {
      throw createError({ statusCode: 400, message: 'Recipient missing' });
    }

    const emails = getEmailsDB();
    if (!emails[recipient]) emails[recipient] = [];
    
    emails[recipient].unshift({
        id: crypto.randomUUID(),
        from,
        subject,
        bodyPlain,
        bodyHtml,
        timestamp: new Date().toISOString()
    });

    if (emails[recipient].length > 20) emails[recipient].pop();

    saveEmailsDB(emails);
    console.log(`[Nuxt API] Email for ${recipient} from ${from}`);
    
    return { status: 'OK' };
});
