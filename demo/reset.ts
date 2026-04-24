// @ts-nocheck
/**
 * demo/reset.ts — clear seeded demo data. Leaves the repo as if the
 * seed had never run.
 *
 * Run: npm run demo:reset
 */

import { unlinkSync, existsSync } from 'fs';

const files = [
  '.data/users.json',
  '.data/student-exam-profiles.json',
  '.data/plan-templates.json',
  '.data/session-plans.json',
  '.data/practice-sessions.json',
  'demo/demo-token.txt',
  'frontend/public/demo.html',
];

console.log('Clearing demo seed data…\n');
let removed = 0;
for (const f of files) {
  if (existsSync(f)) {
    try {
      unlinkSync(f);
      console.log(`  removed  ${f}`);
      removed += 1;
    } catch (e: any) {
      console.log(`  FAIL     ${f}  (${e.message})`);
    }
  } else {
    console.log(`  skipped  ${f}  (not present)`);
  }
}
console.log(`\n${removed} file(s) removed.`);
console.log('Run `npm run demo:seed` to recreate the demo.');
