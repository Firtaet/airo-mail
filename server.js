require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer(); // Mailgun webhooks are usually multipart/form-data

// Use a simple JSON file for storage or memory
// For a "temp-mail", let's use an in-memory object for simplicity, or save it to demo durability
let emails = {}; // { "user@domain.xyz": [ { from, subject, body, timestamp }, ... ] }

const DB_FILE = path.join(__dirname, 'db.json');
if (fs.existsSync(DB_FILE)) {
    emails = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(emails, null, 2));
}

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mailgun Webhook Verification
function verifyMailgunSignature(token, timestamp, signature) {
    const value = timestamp + token;
    const hash = crypto
        .createHmac('sha256', process.env.MAILGUN_HTTP_WEBHOOK_KEY)
        .update(value)
        .digest('hex');
    return hash === signature;
}

// 1. Webhook for Inbound Mail
// This is where Mailgun POSTs incoming emails
app.post('/webhook', upload.any(), (req, res) => {
    const data = req.body;
    const { token, timestamp, signature } = data;

    // Verify signature
    if (!verifyMailgunSignature(token, timestamp, signature)) {
        return res.status(401).send('Invalid signature');
    }

    const from = data.from;
    const recipient = data.recipient.toLowerCase();
    const subject = data.subject || '(No Subject)';
    const bodyPlain = data['stripped-text'] || data['body-plain'] || '(No Content)';
    const bodyHtml = data['stripped-html'] || data['body-html'];
    
    // Save to our "database"
    if (!emails[recipient]) emails[recipient] = [];
    emails[recipient].unshift({
        id: crypto.randomUUID(),
        from,
        subject,
        bodyPlain,
        bodyHtml,
        timestamp: new Date().toISOString()
    });

    // Keep only last 20 emails per address to avoid bloat
    if (emails[recipient].length > 20) emails[recipient].pop();

    saveDB();
    console.log(`Received email for ${recipient} from ${from}`);
    res.status(200).send('OK');
});

// 2. Fetch emails for a specific address
app.get('/api/emails/:address', (req, res) => {
    const address = req.params.address.toLowerCase();
    res.json(emails[address] || []);
});

// 3. Clear emails for an address
app.delete('/api/emails/:address', (req, res) => {
    const address = req.params.address.toLowerCase();
    emails[address] = [];
    saveDB();
    res.json({ status: 'cleared' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
