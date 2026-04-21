// @ts-nocheck
/**
 * Owner Reset CLI — shell-access-gated escape hatch
 *
 * Only usable by whoever has shell access to the deployment. This is
 * intentional: in a DB-less system, "who controls the filesystem" is
 * the ultimate source of ownership truth.
 *
 * Usage:
 *   npx tsx scripts/admin/assign-owner.ts --email owner@example.com
 *   npx tsx scripts/admin/assign-owner.ts --user-id user_xxxx
 *   npx tsx scripts/admin/assign-owner.ts --list
 *
 * If no user matches, prints the full user list for reference.
 */

import fs from 'fs';
import path from 'path';

const STORE_PATH = path.resolve(process.cwd(), '.data/users.json');

const args = process.argv.slice(2);
const emailIdx = args.indexOf('--email');
const idIdx = args.indexOf('--user-id');
const listMode = args.includes('--list');
const targetEmail = emailIdx >= 0 ? args[emailIdx + 1] : null;
const targetId = idIdx >= 0 ? args[idIdx + 1] : null;

if (!fs.existsSync(STORE_PATH)) {
  console.error(`No user store found at ${STORE_PATH}. No users have signed in yet.`);
  process.exit(1);
}

const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));

function pad(s: string, n: number) { return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length); }

if (listMode || (!targetEmail && !targetId)) {
  console.log('');
  console.log(`Users (${Object.keys(store.users).length} total, current owner: ${store.owner_id || 'none'})`);
  console.log('');
  console.log('  Role    | ID                        | Email                         | Last seen');
  console.log('  --------|---------------------------|-------------------------------|--------------------');
  for (const u of Object.values(store.users)) {
    const isOwner = u.id === store.owner_id;
    console.log(
      `  ${pad(u.role + (isOwner ? '*' : ''), 7)} | ${pad(u.id, 25)} | ${pad(u.email, 29)} | ${u.last_seen_at?.slice(0, 19) || '-'}`
    );
  }
  if (!listMode && !targetEmail && !targetId) {
    console.log('');
    console.log('To set a new owner, use:');
    console.log('  --email <email>   assign owner by email');
    console.log('  --user-id <id>    assign owner by id');
  }
  process.exit(0);
}

// Find the target user
let target: any = null;
if (targetEmail) {
  target = Object.values(store.users).find((u: any) => u.email.toLowerCase() === targetEmail.toLowerCase());
}
if (!target && targetId) {
  target = store.users[targetId];
}
if (!target) {
  console.error(`User not found: ${targetEmail || targetId}`);
  console.error('Run with --list to see all users.');
  process.exit(1);
}

// Demote current owner if exists
const previousOwner = store.owner_id ? store.users[store.owner_id] : null;
if (previousOwner && previousOwner.id !== target.id) {
  previousOwner.role = 'admin';
  console.log(`Previous owner ${previousOwner.email} demoted to admin.`);
}
target.role = 'owner';
store.owner_id = target.id;

// Atomic write
const tmp = `${STORE_PATH}.tmp`;
fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
fs.renameSync(tmp, STORE_PATH);

console.log('');
console.log(`✓ Owner set to ${target.email} (id: ${target.id})`);
console.log('  This user will have full control on next sign-in.');
