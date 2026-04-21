// @ts-nocheck
/**
 * WhatsApp Adapter (Meta Cloud API)
 *
 * Webhook-based integration. Uses Meta's hosted Cloud API directly.
 *
 * Setup (significant — involves Meta Business verification):
 *   1. Create a Meta developer app, add the WhatsApp product
 *   2. Obtain WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID
 *   3. Set WHATSAPP_VERIFY_TOKEN (your secret for webhook verification)
 *   4. Configure webhook URL in Meta dashboard:
 *        <PUBLIC_URL>/api/channels/whatsapp/webhook
 *   5. Subscribe to "messages" events on the phone number
 *   6. Users message your business number; first interaction sends a link URL
 *
 * MVP capabilities same as Telegram adapter. WhatsApp has additional
 * messaging-template constraints for outbound messages — for MVP we
 * only reply within the 24-hour session window (no template management).
 *
 * Full details: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

import { ServerResponse } from 'http';
import { getUserByChannel } from '../auth/user-store';
import { createChannelLinkToken } from '../api/auth-routes';

interface ParsedRequest {
  pathname: string;
  query: URLSearchParams;
  params: Record<string, string>;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
}
type RouteHandler = (req: ParsedRequest, res: ServerResponse) => Promise<void>;

function sendJSON(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}
function sendText(res: ServerResponse, text: string, status = 200) {
  res.writeHead(status, { 'Content-Type': 'text/plain' });
  res.end(text);
}

const GRAPH_API = 'https://graph.facebook.com/v20.0';

async function sendMessage(to: string, text: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phone_id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phone_id) return;
  try {
    await fetch(`${GRAPH_API}/${phone_id}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });
  } catch (err) {
    console.error('[whatsapp] sendMessage failed:', (err as Error).message);
  }
}

// ============================================================================
// Webhook verification (GET) — required by Meta
// ============================================================================

async function handleVerify(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const mode = req.query.get('hub.mode');
  const token = req.query.get('hub.verify_token');
  const challenge = req.query.get('hub.challenge');
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === 'subscribe' && token === expected && challenge) {
    return sendText(res, challenge);
  }
  sendText(res, 'verification failed', 403);
}

// ============================================================================
// Webhook receiver (POST)
// ============================================================================

async function handleReceive(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const body: any = req.body || {};
  // Always 200 fast so Meta doesn't retry — process async
  sendJSON(res, { ok: true });

  try {
    const entries = body.entry || [];
    for (const entry of entries) {
      for (const change of entry.changes || []) {
        const messages = change.value?.messages;
        if (!messages) continue;
        for (const msg of messages) {
          const from = msg.from; // E.164 sender phone number
          if (!from) continue;

          const user = getUserByChannel(`whatsapp:${from}`);

          if (msg.type === 'text') {
            const text = (msg.text?.body || '').trim();
            if (text.toLowerCase() === 'start' || !user) {
              const linkToken = createChannelLinkToken('whatsapp', from);
              const baseUrl = process.env.PUBLIC_URL || 'http://localhost:5173';
              await sendMessage(from,
                `Welcome to Vidhya. To link this WhatsApp number to your account, click:\n\n` +
                `${baseUrl}/sign-in?link_token=${linkToken}\n\n` +
                `Then sign in with Google. Once linked, you can ask questions or send photos of math problems.`
              );
            } else {
              await sendMessage(from,
                `Received your question. Full chat integration arrives in the next release — ` +
                `please use the web app for now: ${process.env.PUBLIC_URL || ''}`
              );
            }
          } else if (msg.type === 'image') {
            if (!user) {
              await sendMessage(from, 'Please send "start" to link your account first.');
            } else {
              await sendMessage(from, 'Got your photo. Image analysis via WhatsApp arrives in the next release.');
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[whatsapp] webhook error:', (err as Error).message);
  }
}

export const whatsappRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET',  path: '/api/channels/whatsapp/webhook', handler: handleVerify },
  { method: 'POST', path: '/api/channels/whatsapp/webhook', handler: handleReceive },
];
