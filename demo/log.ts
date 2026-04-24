// @ts-nocheck
/**
 * demo/log.ts — print the demo-usage log.
 *
 * Usage:
 *   npm run demo:log              # last 50 events, newest first
 *   npm run demo:log -- --all     # all stored events (up to 1000)
 *   npm run demo:log -- --summary # aggregate counts, no per-event list
 */

import { listDemoEvents, summariseDemoLog } from './telemetry';

const args = process.argv.slice(2);
const all = args.includes('--all');
const summaryOnly = args.includes('--summary');
const limit = all ? 1000 : 50;

const summary = summariseDemoLog();

console.log('\nDemo usage log');
console.log('─'.repeat(60));
console.log(`  total events: ${summary.total}`);
console.log(`  first:        ${summary.first ?? '(no events)'}`);
console.log(`  last:         ${summary.last ?? '(no events)'}`);
console.log('');
console.log('  by role:');
for (const [role, count] of Object.entries(summary.by_role).sort((a,b) => b[1]-a[1])) {
  console.log(`    ${role.padEnd(10)} ${count}`);
}
console.log('');
console.log('  by event kind:');
for (const [kind, count] of Object.entries(summary.by_event).sort((a,b) => b[1]-a[1])) {
  console.log(`    ${kind.padEnd(16)} ${count}`);
}

if (summaryOnly) {
  console.log('\n(run without --summary to see per-event lines)\n');
  process.exit(0);
}

const events = listDemoEvents(limit);
console.log('\n' + '─'.repeat(60));
console.log(`Last ${events.length} event${events.length === 1 ? '' : 's'} (newest first):`);
console.log('─'.repeat(60));
for (const e of events) {
  const when = e.timestamp.replace('T', ' ').slice(0, 19);
  const role = (e.role ?? '?').padEnd(8);
  const user = (e.user_id ?? '—').padEnd(16);
  const detail = e.detail ? '  ' + JSON.stringify(e.detail) : '';
  console.log(`  ${when}  ${role}  ${user}  ${e.event}${detail}`);
}
console.log('');
if (!all && summary.total > limit) {
  console.log(`  (${summary.total - limit} older events not shown — run with --all to see them)\n`);
}
