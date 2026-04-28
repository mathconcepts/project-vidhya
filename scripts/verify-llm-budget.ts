// @ts-nocheck
/**
 * scripts/verify-llm-budget.ts
 *
 * Runtime test for the LLM budget cap when configured.
 *
 * Why a script instead of a vitest: the budget module reads
 * VIDHYA_LLM_DAILY_TOKEN_CAP_PER_USER once at module load via a
 * top-level constant. Vitest's module cache makes setting env
 * vars per-test unreliable — the module loads with whatever
 * env was set when the test process started.
 *
 * This script sets the env var, imports the module fresh, and
 * exercises the cap path. Run via `npm run verify:budget`.
 *
 * Exit code:
 *   0 — all assertions passed
 *   1 — any assertion failed
 */

process.env.VIDHYA_LLM_DAILY_TOKEN_CAP_PER_USER = '10000';

let pass_count = 0;
let fail_count = 0;
function pass(msg: string) { console.log(`  ✓ ${msg}`); pass_count += 1; }
function fail(msg: string) { console.error(`  ✗ ${msg}`); fail_count += 1; }

async function main() {
  console.log('\nLLM-budget verification\n');

  const m = await import('../src/lib/llm-budget');
  m._resetForTests();

  if (m.isBudgetCapEnabled()) pass('isBudgetCapEnabled() returns true with env var set');
  else fail(`isBudgetCapEnabled() returned false; env=${process.env.VIDHYA_LLM_DAILY_TOKEN_CAP_PER_USER}`);

  // Reserve under cap → allowed
  const r1 = m.tryReserveTokens('user-1', 3000);
  if (r1.allowed && r1.cap === 10000 && r1.remaining === 7000) pass('first reserve under cap allowed, remaining 7000');
  else fail(`expected allowed=true cap=10000 remaining=7000; got ${JSON.stringify(r1)}`);

  // Reserve more under cap → still allowed
  const r2 = m.tryReserveTokens('user-1', 5000);
  if (r2.allowed && r2.remaining === 2000) pass('second reserve under cap allowed, remaining 2000');
  else fail(`expected allowed=true remaining=2000; got ${JSON.stringify(r2)}`);

  // Reserve over cap → denied
  const r3 = m.tryReserveTokens('user-1', 5000);
  if (!r3.allowed && r3.remaining === 2000) pass('reserve over cap denied');
  else fail(`expected allowed=false remaining=2000; got ${JSON.stringify(r3)}`);

  // Different user has fresh budget
  const r4 = m.tryReserveTokens('user-2', 9999);
  if (r4.allowed) pass('different user has fresh budget');
  else fail(`expected allowed=true for user-2; got ${JSON.stringify(r4)}`);

  // Record usage less than reservation → reservation freed, used count exact
  m.recordUsage('user-1', 2500, 3000);
  const s = m.getBudgetStatus('user-1');
  // After reserves: 3000 + 5000 = 8000 reserved (third was denied so didn't add)
  // recordUsage(2500, 3000) frees 3000 reservation, adds 2500 used
  // So: used=2500, reserved=8000-3000=5000
  if (s.used === 2500 && s.reserved === 5000) pass('recordUsage reconciles reservation correctly');
  else fail(`expected used=2500 reserved=5000; got ${JSON.stringify(s)}`);

  // Now we should be able to reserve again because reservation freed
  const r5 = m.tryReserveTokens('user-1', 2500);
  // remaining = cap - used - reserved = 10000 - 2500 - 5000 - 2500 = 0
  if (r5.allowed && r5.remaining === 0) pass('further reserve allowed after reconcile, remaining 0');
  else fail(`expected allowed=true remaining=0; got ${JSON.stringify(r5)}`);

  // One more should fail — hit the cap exactly
  const r6 = m.tryReserveTokens('user-1', 1);
  if (!r6.allowed) pass('reserve at exact cap correctly denies further calls');
  else fail(`expected allowed=false; got ${JSON.stringify(r6)}`);

  // cancelReservation frees without adding to used
  m.cancelReservation('user-1', 2500);
  const s2 = m.getBudgetStatus('user-1');
  // reserved was 7500 (5000 from first reconcile + 2500 from r5), now -2500 = 5000
  if (s2.reserved === 5000 && s2.used === 2500) pass('cancelReservation frees without adding to used');
  else fail(`expected reserved=5000 used=2500; got ${JSON.stringify(s2)}`);

  console.log('');
  if (fail_count === 0) {
    console.log(`All ${pass_count} checks passed. Budget cap works end-to-end.`);
    process.exit(0);
  } else {
    console.error(`${fail_count} check(s) failed (${pass_count} passed)`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
