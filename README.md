# TempMail Service (Mailgun Integration)

This is a premium, modern temporary email service built using **Node.js (Express)** on the backend and **Clean HTML/CSS/JS** on the frontend. It uses **Mailgun** to handle incoming emails.

## 🚀 Setup Instructions

### 1. External configuration (DNS)
Make sure your domain `firtaet.xyz` has its **MX records** pointing to Mailgun:
- `mxa.mailgun.org` (Priority 10)
- `mxb.mailgun.org` (Priority 10)

### 2. Configure Mailgun Route
To receive emails, you must create a **Route** in your Mailgun dashboard:
1. Go to **Receiving** -> **Routes**.
2. Create a New Route.
3. **Expression Type**: Catch All (or use a Regex like `match_recipient(".*@firtaet.xyz")`).
4. **Action**: Forward to `http://YOUR_SERVER_IP:3000/webhook` (or your domain/ngrok URL).
5. **Priority**: 0.
6. **Description**: TempMail Webhook.

### 3. Run the App
```bash
npm install
npm start
```
The client will be available at `http://localhost:3000`.

## 📁 Project Structure
- `server.js`: Express server that listens for Mailgun POST webhooks, verifies signatures, and stores emails.
- `public/index.html`: Modern frontend with auto-polling (every 5 seconds) to fetch new mail.
- `.env`: Contains your Mailgun API keys.
- `db.json`: Local persistent storage for received emails.

## 🔒 Security
The project includes **Mailgun Signature Verification** to ensure only legitimate requests from Mailgun are processed.
