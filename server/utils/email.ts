import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

interface EmailRecord {
    id: string;
    from: string;
    subject: string;
    bodyPlain: string;
    bodyHtml?: string;
    timestamp: string;
}

const DB_FILE = path.join(process.cwd(), 'db.json');

export function getEmailsDB(): Record<string, EmailRecord[]> {
    if (fs.existsSync(DB_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        } catch (e) {
            return {};
        }
    }
    return {};
}

export function saveEmailsDB(data: Record<string, EmailRecord[]>) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

export function verifyMailgunSignature(token: string, timestamp: string, signature: string, signingKey: string) {
    const value = timestamp + token;
    const hash = crypto
        .createHmac('sha256', signingKey)
        .update(value)
        .digest('hex');
    return hash === signature;
}
