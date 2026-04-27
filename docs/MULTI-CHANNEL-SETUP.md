# Multi-Channel Setup Guide

Vidhya supports three access channels: **Web** (primary), **Telegram** (bot), and **WhatsApp** (Meta Cloud API). This guide walks through setting up each one.

The web channel works out of the box (just configure Google OAuth — see `docs/ROLES-AND-ACCESS.md`). Telegram and WhatsApp are optional — users can sign in and use Vidhya fully on the web without them.

---

## 1. Web (required baseline)

Prerequisite for all channels. Users sign in with Google; other channels require the web sign-in at least once to link.

### 1.1 Create a Google OAuth client

1. Go to https://console.cloud.google.com → **APIs & Services → Credentials**
2. If needed, click **Create Project**. Name it (e.g., "vidhya-deploy").
3. Click **Create Credentials → OAuth client ID**
4. If prompted, configure the OAuth consent screen:
   - User Type: **External** (unless you have Google Workspace)
   - App name: your deployment name (e.g., "Vidhya Tutor")
   - User support email: your email
   - Scopes: **email**, **profile**, **openid** — nothing else needed
   - Test users: add yourself during development
5. Choose **Web application** as the type
6. **Authorized JavaScript origins** — add:
   - `http://localhost:5173` (dev)
   - `https://your-deploy-domain.com` (production)
7. **Authorized redirect URIs** — leave empty (we use the JavaScript/GSI flow, not redirect)
8. Click **Create**. Copy the **Client ID** (looks like `1234567890-abc...apps.googleusercontent.com`)

### 1.2 Configure the server

```bash
# Add to .env
GOOGLE_OAUTH_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
JWT_SECRET=<generate-a-32-character-random-string>
PUBLIC_URL=https://your-deploy-domain.com
```

`JWT_SECRET` can be generated with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Restart the server. Visit `/sign-in` — the Google button should appear.

### 1.3 Claim ownership

The **first user to sign in** becomes the owner automatically (bootstrap rule). Make sure that first user is you:

1. Visit your deployment's `/sign-in` page before anyone else
2. Sign in with Google
3. Check `.data/users.json` on the server to confirm your `role` is `owner`

If the wrong person signed in first, run the escape hatch:

```bash
npx tsx scripts/admin/assign-owner.ts --email you@example.com
```

This requires shell access to the deployment.

---

## 2. Telegram bot (optional)

Lets users access Vidhya from Telegram. Requires a small amount of public-URL exposure for webhook reception.

### 2.1 Create the bot

1. Open Telegram, message **@BotFather**
2. Send `/newbot`. Choose a name (e.g., "Vidhya Tutor") and a username (must end in `bot`, e.g., `vidhya_tutor_bot`)
3. Copy the **HTTP API token** BotFather returns (format: `123456789:ABC...`)
4. Optional: `/setdescription`, `/setabouttext`, `/setuserpic` for polish
5. Optional: `/setcommands`:
   ```
   start - Link this chat to a Vidhya account
   me - Show who you're signed in as
   help - Show available commands
   ```

### 2.2 Configure the server

```bash
# Add to .env
TELEGRAM_BOT_TOKEN=123456789:ABC...
TELEGRAM_WEBHOOK_SECRET=<generate-a-random-string>  # for webhook auth
```

### 2.3 Register the webhook with Telegram

Your server must be reachable on the public internet over HTTPS. Telegram does not support HTTP webhooks, and it does not send cookies.

Once you have a public URL (e.g., `https://vidhya.example.com`):

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://vidhya.example.com/api/channels/telegram/webhook",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>",
    "allowed_updates": ["message", "edited_message"]
  }'
```

Confirm it stuck:

```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"
```

Should return `"url": "https://vidhya.example.com/..."` and `"pending_update_count": 0`.

### 2.4 Test it

1. Open Telegram, message your bot
2. Send `/start`
3. The bot replies with a one-time link URL
4. Click the link — you're sent to `/sign-in?link_token=...`
5. Sign in with Google; the Telegram chat_id binds to your user account
6. Send `/me` to confirm

**Development note:** for local dev without a public URL, use `ngrok http 3000` to tunnel, then use the ngrok URL in `setWebhook`. Re-register the webhook any time the ngrok URL changes (every restart for free tier).

---

## 3. WhatsApp Business (optional — more involved)

WhatsApp integration requires Meta's Cloud API, which involves business verification and a verified phone number. Budget several days for first-time setup.

### 3.1 Prerequisites

- Meta Business Account (create at https://business.facebook.com)
- A phone number that can receive SMS for verification — **cannot** be currently registered on WhatsApp personal or WhatsApp Business apps
- Business verification for production use (takes 2-5 business days)

### 3.2 Create the app

1. Go to https://developers.facebook.com → **My Apps → Create App**
2. Choose **Business** as the app type
3. Name the app; link it to your Business Account
4. In the app dashboard, find **WhatsApp → Getting Started** in the sidebar and click **Add Product → WhatsApp**

### 3.3 Get tokens and IDs

From the WhatsApp **API Setup** page, you'll see:

- **Temporary access token** (24-hour TTL — for testing)
- **Phone number ID** (a numeric string, NOT your phone number)
- **WhatsApp Business Account ID**

For production, generate a **permanent access token**:

1. Go to **Business Settings → Users → System Users**
2. Add a new system user with **Admin** role
3. Under **Assigned Assets**, add the WhatsApp app with Full Control
4. Click **Generate Token** → select the app → set scopes `whatsapp_business_messaging` and `whatsapp_business_management` → no expiration → **Generate**
5. Copy the token

### 3.4 Configure the server

```bash
# Add to .env
WHATSAPP_ACCESS_TOKEN=<permanent-token>
WHATSAPP_PHONE_NUMBER_ID=<numeric-id>
WHATSAPP_VERIFY_TOKEN=<generate-a-random-string>  # for webhook handshake
```

### 3.5 Register the webhook with Meta

1. Back in the app dashboard, go to **WhatsApp → Configuration → Webhook**
2. Click **Edit**
3. **Callback URL:** `https://vidhya.example.com/api/channels/whatsapp/webhook`
4. **Verify token:** the same string you put in `WHATSAPP_VERIFY_TOKEN`
5. Click **Verify and save**. If the server is running correctly, Meta hits your `GET /api/channels/whatsapp/webhook?hub.mode=subscribe&hub.challenge=...&hub.verify_token=...` endpoint and confirms
6. Under **Webhook fields**, subscribe to `messages`

### 3.6 Test it

1. From the WhatsApp API Setup page, **add a test recipient phone number** (your own personal WhatsApp)
2. Message your business number from your personal phone with the text `start`
3. You'll get a reply with a sign-in link
4. Click the link, sign in with Google, your phone binds to your Vidhya account
5. Subsequent messages route through the bot

### 3.7 Production checklist

- **Business verification:** Meta requires this to message beyond test numbers. Takes 2-5 business days. Submit via Business Settings → Security Center.
- **Display name approval:** Your business's display name (what recipients see) needs Meta's approval.
- **Message templates:** Outbound messages outside the 24-hour session window require pre-approved templates. Register these in the **WhatsApp → Message Templates** tab.
- **Payment method:** WhatsApp Business pricing is per-conversation. Add a payment method in Business Settings.
- **Rate limits:** Free tier allows 1,000 service conversations/month. Beyond that, per-conversation fees apply ($0.005-$0.15 USD depending on country).

---

## 4. Channel identity model

Users are identified by one canonical Vidhya user ID. Channels are **additive links** to that user:

```
user_abc123
  ├── channels: ["web",
  │             "telegram:987654321",
  │             "whatsapp:+14155551234"]
```

The same user accessing Vidhya from web, Telegram, and WhatsApp sees the same materials, same progress, same lessons. Their role (owner/admin/teacher/student/parent, plus institution when enabled) applies uniformly across channels.

**Linking flow** (same pattern for Telegram and WhatsApp):

1. User initiates contact on the chat platform (`/start` or any first message)
2. Server creates a **pending link token** (in-memory, 15-min TTL)
3. Bot sends user a URL: `<PUBLIC_URL>/sign-in?link_token=<token>`
4. User opens the URL, signs in with Google
5. Server binds the chat_id/phone_number to the signed-in user
6. Subsequent messages on the chat platform are routed as that user

**Unlinking:** admin can unlink a channel from a user's account via the user-admin UI (`/admin/users`). The user can also send a new sign-in URL to bind to a different account — only one user per chat_id/phone_number is allowed.

---

## 5. Troubleshooting

### "Telegram bot doesn't respond"

1. `getWebhookInfo` — is the URL correct and has `pending_update_count: 0`?
2. Check server logs for `[telegram] webhook error` lines
3. Verify `TELEGRAM_WEBHOOK_SECRET` matches between Telegram's webhook registration and server env
4. Confirm the server's public URL is HTTPS (Telegram requires TLS)

### "WhatsApp webhook verification fails"

1. Server logs should show the GET request from Meta with `hub.mode=subscribe`
2. Verify `WHATSAPP_VERIFY_TOKEN` matches exactly (check for whitespace)
3. Server must respond with the `hub.challenge` value as plain text (not JSON)
4. Public URL must be reachable from Meta's IPs (no IP allowlist on your server)

### "Sign-in link expires immediately"

Link tokens have a 15-minute TTL. If users routinely take longer, increase `LINK_TTL_MS` in `src/api/auth-routes.ts`.

### "User sees 'This chat is not linked'"

The channel ID stored in the user's account doesn't match the one the bot is now receiving. This can happen if:

- User changed their WhatsApp number and re-messaged from the new one
- Admin unlinked the channel
- User's account was deleted and re-created

Solution: user sends `/start` again to re-link.

### "Ownership lost — no one can access admin features"

Use the CLI escape hatch:

```bash
npx tsx scripts/admin/assign-owner.ts --list        # show all users
npx tsx scripts/admin/assign-owner.ts --email ...   # reassign
```

This requires shell access to the deployment. That's intentional: filesystem control IS the ultimate proof of ownership in a DB-less system.

---

## 6. Security notes

- **Never commit** tokens or secrets to git. Use `.env` for local dev, secrets manager for production.
- **Rotate `JWT_SECRET`** only when you're ready to invalidate all existing sessions — rotating it forces everyone to sign in again.
- **Telegram webhook secret** verifies the `X-Telegram-Bot-Api-Secret-Token` header. Without it, a bad actor who knows your webhook URL could POST fake updates.
- **WhatsApp verify token** is only used during the one-time webhook handshake; it's not a live auth mechanism. The access token is what authenticates live calls.
- **Google `sub` is the identity anchor** — if a user changes their email, their Google `sub` stays the same; we bind to `sub` and update email on next sign-in.
