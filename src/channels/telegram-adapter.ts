// @ts-nocheck
/**
 * Telegram Adapter
 *
 * Webhook-based bot integration. No external library — uses fetch against
 * Telegram's Bot API directly. Keeps the dependency footprint small.
 *
 * Setup:
 *   1. Create bot via @BotFather, get TELEGRAM_BOT_TOKEN
 *   2. Set env: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_URL, TELEGRAM_WEBHOOK_SECRET
 *   3. Register webhook:
 *      POST https://api.telegram.org/bot<token>/setWebhook
 *        { "url": "<TELEGRAM_WEBHOOK_URL>/api/channels/telegram/webhook",
 *          "secret_token": "<TELEGRAM_WEBHOOK_SECRET>" }
 *   4. First /start from a user generates a web link; user completes
 *      Google sign-in, channel binds, subsequent messages route through
 *      this adapter as that user.
 *
 * Capabilities in MVP:
 *   - /start   → welcome + link URL
 *   - /me      → show bound user info
 *   - /help    → list commands
 *   - photo    → routed to /api/multimodal/analyze
 *   - text     → routed to chat flow
 *
 * Non-goals in MVP: inline keyboards, media groups, voice notes.
 */

import { ServerResponse } from 'http';
import { getUserByChannel } from '../auth/user-store';
import { createChannelLinkToken } from '../api/auth-routes';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON, sendError } from '../lib/route-helpers';

const TELEGRAM_API = 'https://api.telegram.org';

async function sendMessage(chat_id: string | number, text: string, parse_mode?: 'Markdown' | 'HTML') {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text, parse_mode, disable_web_page_preview: true }),
    });
  } catch (err) {
    console.error('[telegram] sendMessage failed:', (err as Error).message);
  }
}

async function handleStart(chat_id: number) {
  const token = createChannelLinkToken('telegram', String(chat_id));
  const baseUrl = process.env.PUBLIC_URL || 'http://localhost:5173';
  const link = `${baseUrl}/sign-in?link_token=${token}`;
  await sendMessage(chat_id,
    `Welcome to Vidhya.\n\n` +
    `To link this Telegram chat to your Vidhya account, click this link and sign in with Google:\n\n${link}\n\n` +
    `Once linked, you can send photos of math problems, ask questions, or navigate lessons right here.`
  );
}

async function handleMe(chat_id: number) {
  const user = getUserByChannel(`telegram:${chat_id}`);
  if (!user) {
    await sendMessage(chat_id, 'This chat is not linked to a Vidhya account. Send /start to link.');
    return;
  }
  await sendMessage(chat_id,
    `Linked as *${user.name}* (${user.email})\n` +
    `Role: ${user.role}\n` +
    `Member since: ${user.created_at.slice(0, 10)}`,
    'Markdown'
  );
}

async function handleHelp(chat_id: number) {
  await sendMessage(chat_id,
    `Available commands:\n` +
    `/start — link this chat to your Vidhya account\n` +
    `/me — show who you're signed in as\n` +
    `/help — show this message\n\n` +
    `You can also send a photo of a math problem, or ask a question.`
  );
}

async function handleTextMessage(chat_id: number, text: string) {
  const user = getUserByChannel(`telegram:${chat_id}`);
  if (!user) {
    await sendMessage(chat_id, 'Please /start first to link your account.');
    return;
  }
  // MVP: echo-style acknowledgment. Full integration with /api/chat
  // streaming pattern is a follow-up — Telegram responses need chunking
  // and 4096-char splits, which deserves careful UX design.
  await sendMessage(chat_id,
    `Received your question. Full chat integration arrives in the next release — ` +
    `for now, please use the web app at ${process.env.PUBLIC_URL || 'the app URL'} to continue.`
  );
}

// ============================================================================
// Webhook handler
// ============================================================================

async function handleWebhook(req: ParsedRequest, res: ServerResponse): Promise<void> {
  // Telegram secret token check
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected) {
    const got = req.headers['x-telegram-bot-api-secret-token'];
    if (got !== expected) return sendJSON(res, { error: 'unauthorized' }, 401);
  }

  const update: any = req.body || {};
  const message = update.message || update.edited_message;
  if (!message) return sendJSON(res, { ok: true });

  const chat_id = message.chat?.id;
  if (!chat_id) return sendJSON(res, { ok: true });

  try {
    if (typeof message.text === 'string') {
      const text = message.text.trim();
      if (text === '/start') await handleStart(chat_id);
      else if (text === '/me') await handleMe(chat_id);
      else if (text === '/help') await handleHelp(chat_id);
      else await handleTextMessage(chat_id, text);
    } else if (message.photo) {
      const user = getUserByChannel(`telegram:${chat_id}`);
      if (!user) {
        await sendMessage(chat_id, 'Please /start first to link your account.');
      } else {
        await sendMessage(chat_id, 'Got your photo. Image analysis via Telegram arrives in the next release.');
      }
    }
  } catch (err) {
    console.error('[telegram] webhook error:', (err as Error).message);
  }
  sendJSON(res, { ok: true });
}

export const telegramRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'POST', path: '/api/channels/telegram/webhook', handler: handleWebhook },
];
