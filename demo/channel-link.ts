// @ts-nocheck
/**
 * demo/channel-link.ts — bind a demo user to a real channel identity
 * so messages from that channel reach the demo user.
 *
 * Usage:
 *   npm run demo:channel-link -- --role=student-active --channel=telegram --id=12345678
 *   npm run demo:channel-link -- --role=teacher --channel=whatsapp --id=+919876543210
 *   npm run demo:channel-link -- --list
 *   npm run demo:channel-link -- --unlink --role=student-active --channel=telegram
 *
 * What it does:
 *   - Reads demo/demo-tokens.json to resolve a --role label to a user_id
 *   - Calls linkChannel() from src/auth/user-store
 *   - Prints the binding so the operator knows it took effect
 *
 * How the tester knows their own Telegram user ID:
 *   - Message @userinfobot on Telegram — it echoes your numeric user id
 *   - Or open your bot, send any message, then:
 *       curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates"
 *     and find "from":{"id": <your-id>} in the response
 */

import { readFileSync, existsSync } from 'fs';
import { linkChannel, unlinkChannel, getUserByChannel, listUsers } from '../src/auth/user-store';

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'demo-secret-for-local-testing-only-min-16ch';
}

// ─── args ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const pref = `--${name}=`;
  const found = args.find(a => a.startsWith(pref));
  return found ? found.slice(pref.length) : undefined;
};
const has = (name: string): boolean => args.includes(`--${name}`);

const role     = flag('role');
const channel  = flag('channel') as 'telegram' | 'whatsapp' | undefined;
const id       = flag('id');
const isList   = has('list');
const isUnlink = has('unlink');

// ─── list mode ────────────────────────────────────────────────────────

if (isList) {
  console.log('\nCurrent channel bindings:\n');
  const users = listUsers();
  const interesting = users.filter(u => u.channels && u.channels.some(c => c.startsWith('telegram:') || c.startsWith('whatsapp:')));
  if (interesting.length === 0) {
    console.log('  (no users linked to any channel)');
  } else {
    for (const u of interesting) {
      console.log(`  ${u.name}  (${u.role})`);
      console.log(`    user_id: ${u.id}`);
      for (const c of u.channels) {
        if (c.startsWith('telegram:') || c.startsWith('whatsapp:')) {
          console.log(`    ${c}`);
        }
      }
      console.log('');
    }
  }
  process.exit(0);
}

// ─── validate ─────────────────────────────────────────────────────────

if (!role || !channel) {
  console.error('Usage:');
  console.error('  npm run demo:channel-link -- --role=<label> --channel=<telegram|whatsapp> --id=<channel-id>');
  console.error('  npm run demo:channel-link -- --list');
  console.error('  npm run demo:channel-link -- --unlink --role=<label> --channel=<telegram|whatsapp>');
  console.error('');
  console.error('Valid roles (from demo/demo-tokens.json):');
  console.error('  owner | admin | teacher | student-active | student-light | student-new');
  process.exit(1);
}

if (channel !== 'telegram' && channel !== 'whatsapp') {
  console.error(`--channel must be "telegram" or "whatsapp" (got "${channel}")`);
  process.exit(1);
}

if (!isUnlink && !id) {
  console.error('--id is required (the numeric Telegram user id or WhatsApp phone number)');
  process.exit(1);
}

if (!existsSync('demo/demo-tokens.json')) {
  console.error('demo/demo-tokens.json missing — run `npm run demo:seed` first.');
  process.exit(1);
}

const tokens = JSON.parse(readFileSync('demo/demo-tokens.json', 'utf-8'));
const entry = tokens[role];
if (!entry) {
  console.error(`Role "${role}" not found in demo/demo-tokens.json.`);
  console.error(`Available roles: ${Object.keys(tokens).join(', ')}`);
  process.exit(1);
}

const userId = entry.user_id;
console.log(`Resolving ${role} → user_id ${userId} (${entry.name})`);

// ─── link / unlink ────────────────────────────────────────────────────

if (isUnlink) {
  // Find the existing binding for this (user, channel) so we know which id to pass
  const existing = listUsers().find(u => u.id === userId);
  if (!existing) { console.error('user not found in store'); process.exit(1); }
  const bound = (existing.channels ?? []).find((c: string) => c.startsWith(`${channel}:`));
  if (!bound) {
    console.log(`No ${channel} binding on ${role} — nothing to unlink.`);
    process.exit(0);
  }
  const res = unlinkChannel({ user_id: userId, channel_key: bound });
  if (!res.ok) {
    console.error(`unlink failed`);
    process.exit(1);
  }
  console.log(`✓ unlinked ${bound} from ${role}`);
  process.exit(0);
}

// --- normal link path
console.log(`Linking ${channel}:${id} to ${role} (${entry.name}) …`);

// First check the channel isn't already bound elsewhere — linkChannel would
// refuse, but we want a human-readable message in advance.
const already = getUserByChannel(`${channel}:${id}`);
if (already && already.id !== userId) {
  console.error(`${channel}:${id} is already linked to ${already.name} (${already.role}).`);
  console.error(`Unlink it first:`);
  console.error(`  npm run demo:channel-link -- --unlink --role=<that-role> --channel=${channel}`);
  process.exit(1);
}

const res = linkChannel({
  user_id: userId,
  channel,
  channel_specific_id: id,
});
if (!res.ok) {
  console.error(`link failed: ${res.reason}`);
  process.exit(1);
}

console.log('');
console.log('═'.repeat(60));
console.log(`  ✓ Linked ${channel}:${id} → ${entry.name} (${role})`);
console.log('═'.repeat(60));
console.log('');
console.log('Now try:');
if (channel === 'telegram') {
  console.log('  1. Open your Telegram bot (the one whose token you configured)');
  console.log('  2. Send /start');
  console.log(`  3. The server will resolve your Telegram id to ${entry.name}`);
  console.log(`     and respond in-role.`);
} else {
  console.log('  1. Send any message to the WhatsApp business number');
  console.log('     whose Phone Number ID you configured');
  console.log(`  2. The server will resolve your WA number to ${entry.name}`);
}
console.log('');
console.log('To unlink:');
console.log(`  npm run demo:channel-link -- --unlink --role=${role} --channel=${channel}`);
console.log('');
console.log('To see all current bindings:');
console.log('  npm run demo:channel-link -- --list');
console.log('');
