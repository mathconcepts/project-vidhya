// @ts-nocheck
/**
 * scripts/migrations/001-drop-attention-counter.ts
 *
 * Strip the legacy `attention_counter` field from every user record
 * in .data/users.json.
 *
 * Context: this field existed in an earlier schema before attention
 * state moved to a dedicated store. The field has been unused in
 * code since then, but older .data/ directories may carry it. This
 * migration cleans it up.
 *
 * Idempotent: running multiple times is safe. Reports 0 users
 * affected on subsequent runs.
 *
 * Usage:
 *   npx tsx scripts/migrations/001-drop-attention-counter.ts
 *
 * PENDING.md §7.1.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

const USERS_PATH = '.data/users.json';

function main(): void {
  if (!existsSync(USERS_PATH)) {
    console.log(`${USERS_PATH} does not exist — nothing to migrate.`);
    return;
  }

  const raw = JSON.parse(readFileSync(USERS_PATH, 'utf-8'));
  let updated = 0;
  for (const [id, user] of Object.entries(raw.users || {})) {
    if (user && typeof user === 'object' && 'attention_counter' in (user as any)) {
      delete (user as any).attention_counter;
      updated += 1;
    }
  }

  if (updated > 0) {
    writeFileSync(USERS_PATH, JSON.stringify(raw, null, 2));
    console.log(`✓ dropped attention_counter from ${updated} user record(s).`);
  } else {
    console.log('No users carry the legacy attention_counter field — nothing to do.');
  }
}

main();
