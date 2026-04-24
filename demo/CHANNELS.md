# Vidhya demo — Telegram and WhatsApp access

The web demo is the primary path — one click on the role picker and
you're in. This doc is for the next step: letting testers reach the
demo over **Telegram** or **WhatsApp**, with their own chat account
mapped to one of the seeded demo users.

Unlike the web demo (zero credentials, runs on localhost), channel
access genuinely requires the operator to:
1. Obtain bot credentials (Telegram bot token from @BotFather,
   WhatsApp Cloud API credentials from Meta)
2. Have a **publicly reachable URL** for webhooks (both channels
   are webhook-only in this codebase — no long-polling)
3. Link each tester's real Telegram/WhatsApp identity to a demo
   user on the server

This guide covers all three.

---

## Three deployment shapes

| Shape | Effort | Webhook public URL | Persistence |
|---|---|---|---|
| **Local + ngrok tunnel** | 10 min | `https://<random>.ngrok.app` | Your disk |
| **Hosted (Render / Railway / Fly)** | 15 min | `https://<your-app>.<domain>` | Platform volume |
| **Fully production** | any | Your own domain | Managed DB optional |

All three serve the same webhook endpoints — the only difference is
where the bot server lives.

---

## Step 1 — get credentials

### Telegram

1. Open Telegram. Message **@BotFather**.
2. Send `/newbot`. Pick a name ("Vidhya Demo Tutor") and a username
   ending in `bot` (e.g. `vidhya_demo_bot`).
3. BotFather replies with a **bot token** — a string like
   `7112345678:AAEabcdefghijklmnopqrstuvwxyz012345`.
4. Keep it secret. It IS the bot — anyone with the token can
   impersonate it.

### WhatsApp

1. Create a Meta developer account at
   <https://developers.facebook.com>.
2. Create a new app → Business type → add the WhatsApp product.
3. From the app dashboard, copy:
   - **Phone number ID** (numeric, next to the test phone number)
   - **Temporary access token** (24h validity; for longer use
     generate a System User token from Business Settings)
4. Pick a **verify token** — any string you choose (e.g.
   `vidhya-demo-verify-2026`). Meta will echo it back when
   confirming webhook ownership.

---

## Step 2 — choose a deployment shape

### 2a — Local + ngrok (simplest path to try)

```bash
# Install ngrok once
brew install ngrok           # macOS
# or download from https://ngrok.com

# Tunnel port 8080 to a public URL
ngrok http 8080
```

ngrok prints something like:

```
Forwarding  https://9a1b-203-0-113-42.ngrok.app -> http://localhost:8080
```

That `https://9a1b-...ngrok.app` is your `PUBLIC_URL`. It changes
every time you restart ngrok (unless you're on a paid plan with a
reserved domain), so you'll re-register the webhook each session.

### 2b — Hosted (persistent URL)

Deploy via any of the paths in [`HOSTING.md`](./HOSTING.md).
Your deployment URL (e.g. `https://my-vidhya-demo.onrender.com`)
is your `PUBLIC_URL`. Stable across restarts.

---

## Step 3 — wire up the channel

Export the env vars your chosen channel needs, then run the setup
script:

```bash
# Telegram
export TELEGRAM_BOT_TOKEN="7112345678:AAE…"
export PUBLIC_URL="https://9a1b-203-0-113-42.ngrok.app"
npm run demo:channel-setup
```

```bash
# WhatsApp
export WHATSAPP_ACCESS_TOKEN="EAAB…"
export WHATSAPP_PHONE_NUMBER_ID="106500519234765"
export WHATSAPP_VERIFY_TOKEN="vidhya-demo-verify-2026"
export PUBLIC_URL="https://9a1b-203-0-113-42.ngrok.app"
npm run demo:channel-setup
```

The script:
1. Validates the credentials by calling Telegram's `/getMe` or
   Meta's Graph API.
2. Prints the **exact webhook URL** you need to register.
3. Tells you what to do next.

### Registering the webhook

**Telegram** — one curl command:

```bash
curl -sS -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=$PUBLIC_URL/api/channels/telegram/webhook"
```

The expected response: `{"ok":true,"result":true,"description":"Webhook was set"}`.

**WhatsApp** — in the Meta dashboard:

1. App → WhatsApp → Configuration → Callback URL
2. Callback URL: `$PUBLIC_URL/api/channels/whatsapp/webhook`
3. Verify token: the string you picked (`WHATSAPP_VERIFY_TOKEN`)
4. Click **Verify and save**
5. Subscribe to the `messages` webhook field

Meta's UI immediately calls your `GET /api/channels/whatsapp/webhook`
with the verify token; the server echoes it back and the subscription
activates.

---

## Step 4 — start the backend with the channel env vars

```bash
export TELEGRAM_BOT_TOKEN="…"          # or the WhatsApp vars
export JWT_SECRET="demo-secret-for-local-testing-only-min-16ch"
npm run demo:start
```

The backend's startup sequence loads whichever channels have
credentials and starts processing inbound webhooks.

At this point the bot exists and can receive messages, but the
server doesn't yet know which demo user to map each inbound chat
to. That's the next step.

---

## Step 5 — link a channel identity to a demo user

To find your own Telegram user ID (you — the tester):

1. Open Telegram. Message **@userinfobot**.
2. It replies with your numeric `id` (e.g. `256789431`).

Then bind:

```bash
npm run demo:channel-link -- \
    --role=student-active \
    --channel=telegram \
    --id=256789431
```

From this moment, any message you send to the bot comes through as
**Priya Sharma (student)**. Server-side routing uses `getUserByChannel`
to resolve `telegram:256789431` → Priya's user_id → Priya's role +
exam profile + plan history.

Role labels match the demo tokens: `owner`, `admin`, `teacher`,
`student-active`, `student-light`, `student-new`.

### WhatsApp

The **id** for WhatsApp is the full phone number in international
format without the `+` (it's how Meta delivers sender phone numbers
in webhook payloads):

```bash
npm run demo:channel-link -- \
    --role=teacher \
    --channel=whatsapp \
    --id=919876543210
```

### Listing current bindings

```bash
npm run demo:channel-link -- --list
```

### Unlinking

```bash
npm run demo:channel-link -- --unlink --role=student-active --channel=telegram
```

---

## What works, what doesn't — the honest table

| Capability | Over Telegram | Over WhatsApp |
|---|---|---|
| Receive student messages | ✓ | ✓ |
| Send text replies | ✓ | ✓ |
| Send photos (question cards) | ✓ | ✓ |
| Inline buttons / quick replies | ✓ keyboard | limited (list messages only) |
| Scheduled daily-problem push | ✓ | ✓ |
| Snap (photo → problem analysis) | ✓ if photo messages routed to LLM | ✓ same |
| Per-user BYOK for LLM responses | ✗ not propagatable — see below | ✗ same |
| Role-gated admin commands | ✓ (see `/demo-as` pattern) | ✓ |

### The BYOK caveat for channel responses

In the web demo, each tester plugs their own LLM key into
`/gate/llm-config` and the key stays in their browser. Telegram
and WhatsApp messages arrive at the **server**, so there's no browser
context to pull a per-user key from.

The result: chat-style responses over channels use the **server-side
default** provider. You need to set one of these on the bot server:

```bash
export GEMINI_API_KEY="…"
export VIDHYA_LLM_PRIMARY_PROVIDER="gemini"
```

or

```bash
export ANTHROPIC_API_KEY="…"
export VIDHYA_LLM_PRIMARY_PROVIDER="anthropic"
```

This key is paid for by the demo operator, not the tester. Budget
it accordingly. The admin dashboard's usage panel shows spend per
demo user so you can watch it.

---

## The `/demo-as` pattern (optional but useful)

Once a tester has linked their Telegram to `student-active` (Priya),
they might want to experience the demo as a different role — say
`teacher` — without going through another link/unlink dance.

The pattern:

1. In the bot, tester sends `/demo-as teacher`.
2. Your message handler (in `src/channels/service.ts` or a wrapper)
   checks — if the message starts with `/demo-as` and the sender is
   already bound to a demo user, call `linkChannel()` to rebind to
   the requested role.
3. Reply: "You are now seeing the demo as Kavita (teacher)."

This is a 20-line addition to the inbound message handler. It's
not shipped today but `demo/channel-link.ts` and `getUserByChannel`
provide the primitives. A sample implementation stub:

```ts
// inside the channel message-received handler
if (message.text?.startsWith('/demo-as ')) {
  const requestedRole = message.text.slice('/demo-as '.length).trim();
  const tokens = JSON.parse(readFileSync('demo/demo-tokens.json', 'utf-8'));
  const target = tokens[requestedRole];
  if (!target) return sendMessage("Unknown role. Try: owner, admin, teacher, student-active, student-light, student-new");
  // Unbind the current binding, then bind to the new role
  const current = getUserByChannel(`telegram:${message.from.id}`);
  if (current) {
    unlinkChannel({ user_id: current.id, channel_key: `telegram:${message.from.id}` });
  }
  linkChannel({ user_id: target.user_id, channel: 'telegram', channel_specific_id: String(message.from.id) });
  return sendMessage(`You are now the demo as ${target.name} (${target.role}).`);
}
```

Skip it until a tester asks for it.

---

## Security & cost notes

- **Bot tokens are secrets.** Never commit them. Use env vars or a
  `.env` file that's gitignored. Rotate if leaked — @BotFather can
  regenerate Telegram tokens; Meta can invalidate WhatsApp tokens
  from the dashboard.

- **Webhook URLs are public but must be HTTPS.** Both Telegram and
  Meta reject HTTP endpoints. ngrok and every PaaS (Render, Railway,
  Fly) provide HTTPS by default.

- **Rate limits.** Telegram: 30 msgs/sec per bot, 1 msg/sec per chat.
  WhatsApp: varies by your messaging tier — start at 250/day in the
  sandbox. Don't connect a whole classroom at once for a first test.

- **LLM costs scale with conversation volume.** A 20-message demo
  with a tester runs roughly 10-20 cents on Claude Haiku or Gemini
  Flash. Multiply for realism. The admin dashboard's usage panel
  surfaces spend so the operator stays aware.

- **Every inbound message is logged to the demo-usage log** (the
  owner-visible `.data/demo-usage-log.json`). Telegram/WhatsApp
  users get the same logging as web users — the role-picker notice
  applies by extension since they linked via the demo.

---

## Verification

After wiring:

```bash
npm run demo:channel-link -- --list
# Should show your Telegram/WhatsApp id linked to a demo user
```

Then message the bot:
- Telegram: send `/start` to your bot — the first response
  confirms the link.
- WhatsApp: send any message to the business phone number — same.

If nothing comes back:
- Check the backend log — webhook payloads are verbose.
- Confirm `setWebhook` returned `ok:true` (Telegram) or that Meta
  shows the subscription as Active (WhatsApp).
- Run `npm run demo:verify` to check the demo is otherwise healthy.

---

## Related docs

- [`DEMO.md`](../DEMO.md) — main walkthrough
- [`HOSTING.md`](./HOSTING.md) — deployment shapes (needed for a
  public webhook URL)
- [`API-KEYS.md`](./API-KEYS.md) — the key matrix (which features
  need which keys, including `VIDHYA_LLM_PRIMARY_PROVIDER`)
