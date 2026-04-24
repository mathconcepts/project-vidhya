// @ts-nocheck
/**
 * demo/channel-setup.ts — validate operator-provided channel credentials
 * and print the exact next steps to wire the demo up for Telegram
 * and/or WhatsApp.
 *
 * Does NOT call setWebhook itself — the operator chooses when to
 * register the webhook (once they know their public URL).
 *
 * Run:
 *   npm run demo:channel-setup
 *
 * Required env vars:
 *   For Telegram:  TELEGRAM_BOT_TOKEN
 *                  PUBLIC_URL (the domain your backend is reachable at)
 *   For WhatsApp:  WHATSAPP_ACCESS_TOKEN
 *                  WHATSAPP_PHONE_NUMBER_ID
 *                  WHATSAPP_VERIFY_TOKEN (any string you pick; Meta uses it
 *                    to confirm your webhook ownership)
 *                  PUBLIC_URL
 *
 * If both sets are present, both channels are verified. If neither is
 * set, the script prints a setup checklist and exits 0.
 */

const tgToken   = process.env.TELEGRAM_BOT_TOKEN;
const waToken   = process.env.WHATSAPP_ACCESS_TOKEN;
const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const waVerify  = process.env.WHATSAPP_VERIFY_TOKEN;
const publicUrl = (process.env.PUBLIC_URL ?? '').replace(/\/$/, '');

function line(ch: string = '─') { console.log(ch.repeat(60)); }
function header(msg: string) { console.log(`\n${msg}`); line(); }

// ─── Telegram ─────────────────────────────────────────────────────────

async function checkTelegram(): Promise<boolean> {
  header('Telegram');

  if (!tgToken) {
    console.log('  ○ TELEGRAM_BOT_TOKEN not set — skipping.');
    console.log('');
    console.log('  To enable Telegram in the demo:');
    console.log('    1. Open Telegram, message @BotFather');
    console.log('    2. Send /newbot, follow prompts, save the token');
    console.log('    3. Re-run this script with:');
    console.log('         TELEGRAM_BOT_TOKEN=<your-token> \\');
    console.log('         PUBLIC_URL=https://<your-demo-domain> \\');
    console.log('         npm run demo:channel-setup');
    return false;
  }

  console.log('  TELEGRAM_BOT_TOKEN is set. Validating via /getMe …');
  try {
    const r = await fetch(`https://api.telegram.org/bot${tgToken}/getMe`);
    if (!r.ok) {
      console.log(`  ✗ getMe returned ${r.status} — token likely invalid.`);
      return false;
    }
    const body = await r.json();
    if (!body.ok) {
      console.log(`  ✗ getMe: ${body.description ?? 'unknown error'}`);
      return false;
    }
    console.log(`  ✓ bot authenticated: @${body.result.username} (${body.result.first_name})`);
    console.log(`    bot_id:  ${body.result.id}`);
  } catch (e: any) {
    console.log(`  ✗ could not reach api.telegram.org: ${e.message}`);
    return false;
  }

  console.log('');
  console.log('  Webhook URL the bot should POST to:');
  if (!publicUrl) {
    console.log('    (set PUBLIC_URL to see the exact URL)');
    console.log('    <PUBLIC_URL>/api/channels/telegram/webhook');
  } else {
    const webhookUrl = `${publicUrl}/api/channels/telegram/webhook`;
    console.log(`    ${webhookUrl}`);
    console.log('');
    console.log('  Register the webhook with Telegram by running:');
    console.log('');
    console.log(`    curl -sS -X POST "https://api.telegram.org/bot${tgToken.slice(0, 8)}…/setWebhook" \\`);
    console.log(`         -d "url=${webhookUrl}"`);
  }
  console.log('');
  console.log('  Running the demo backend with this var ensures messages dispatched');
  console.log('  by the bot server reach their sender. Export before starting:');
  console.log('');
  console.log(`    export TELEGRAM_BOT_TOKEN="${tgToken.slice(0, 12)}…"`);
  return true;
}

// ─── WhatsApp ─────────────────────────────────────────────────────────

async function checkWhatsApp(): Promise<boolean> {
  header('WhatsApp Cloud API');

  if (!waToken || !waPhoneId || !waVerify) {
    const missing: string[] = [];
    if (!waToken) missing.push('WHATSAPP_ACCESS_TOKEN');
    if (!waPhoneId) missing.push('WHATSAPP_PHONE_NUMBER_ID');
    if (!waVerify) missing.push('WHATSAPP_VERIFY_TOKEN');
    console.log(`  ○ missing env vars: ${missing.join(', ')}`);
    console.log('');
    console.log('  To enable WhatsApp in the demo:');
    console.log('    1. Go to https://developers.facebook.com → create app → add WhatsApp');
    console.log('    2. Grab your "Phone number ID" and a temporary access token');
    console.log('       (24h — for longer sessions generate a System User token)');
    console.log('    3. Pick any string as WHATSAPP_VERIFY_TOKEN (e.g. "vidhya-demo-verify")');
    console.log('    4. Re-run with all three env vars + PUBLIC_URL set');
    return false;
  }

  console.log('  All three WhatsApp vars present. Validating phone-number-id …');
  try {
    const r = await fetch(
      `https://graph.facebook.com/v20.0/${waPhoneId}`,
      { headers: { Authorization: `Bearer ${waToken}` } },
    );
    if (!r.ok) {
      const text = await r.text();
      console.log(`  ✗ Meta Graph API returned ${r.status} — token or phone ID invalid.`);
      console.log(`    response: ${text.slice(0, 200)}`);
      return false;
    }
    const body = await r.json();
    console.log(`  ✓ WhatsApp business phone verified: ${body.display_phone_number ?? '(unknown)'}`);
    console.log(`    verified_name: ${body.verified_name ?? '(unknown)'}`);
  } catch (e: any) {
    console.log(`  ✗ could not reach graph.facebook.com: ${e.message}`);
    return false;
  }

  console.log('');
  console.log('  Webhook configuration:');
  if (!publicUrl) {
    console.log('    (set PUBLIC_URL to see the exact URL)');
    console.log('    <PUBLIC_URL>/api/channels/whatsapp/webhook');
  } else {
    const webhookUrl = `${publicUrl}/api/channels/whatsapp/webhook`;
    console.log(`    Callback URL:   ${webhookUrl}`);
    console.log(`    Verify token:   ${waVerify}`);
    console.log('');
    console.log('  Register in the Meta dashboard:');
    console.log('    WhatsApp → Configuration → Callback URL');
    console.log(`      → paste ${webhookUrl}`);
    console.log(`      → paste verify token: ${waVerify}`);
    console.log('      → tap Verify and Save');
    console.log('      → subscribe to "messages" webhook field');
  }
  return true;
}

// ─── main ─────────────────────────────────────────────────────────────

async function main() {
  console.log('Vidhya demo — channel setup');

  const tgOk = await checkTelegram();
  const waOk = await checkWhatsApp();

  header('Summary');
  console.log(`  Telegram: ${tgOk ? '✓ configured' : '○ not configured'}`);
  console.log(`  WhatsApp: ${waOk ? '✓ configured' : '○ not configured'}`);

  if (!tgOk && !waOk) {
    console.log('');
    console.log('  No channels are configured. The demo will still work in the browser');
    console.log('  (via http://…/demo.html). See demo/CHANNELS.md for full setup.');
    process.exit(0);
  }

  console.log('');
  console.log('  Next steps:');
  if (tgOk || waOk) {
    console.log('    1. Start the backend with the same env vars:');
    console.log('         npm run demo:start   (picks up all exported vars)');
    console.log('    2. Register the webhook (see above).');
    console.log('    3. Link a demo user to your own channel account:');
    console.log('         npm run demo:channel-link -- --role=student-active \\');
    console.log('             --channel=telegram --id=<your-telegram-user-id>');
    console.log('    4. Message the bot. The conversation lands as Priya Sharma.');
  }
  console.log('');
  console.log('  Full guide: demo/CHANNELS.md');
  console.log('');
}

main().catch(e => {
  console.error('Channel setup failed:', e.message);
  process.exit(1);
});
