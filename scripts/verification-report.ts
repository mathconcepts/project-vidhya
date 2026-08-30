// @ts-nocheck
/**
 * Print the verification pass-rate report to the console.
 *
 *   npm run content:verification-report
 *
 * Same data the founder page's ELI5 section reads via
 * GET /api/operator/verification-report — see src/verification/report.ts
 * for what it computes and, just as importantly, what it deliberately
 * does not claim.
 */

import { computeVerificationReport } from '../src/verification/report';

function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}

const report = computeVerificationReport();

console.log('');
console.log('Verification pass-rate report');
console.log(`Generated: ${report.generated_at}`);
console.log('');
console.log(`Practice bank: ${report.practice_bank.total_items} items across ${report.practice_bank.bank_count} banks`);
console.log(`  With a documented verification method: ${report.practice_bank.with_verification_method} (${pct(report.headline.hand_verified_coverage_pct)})`);
console.log(`  hand_checkable_* method family: ${report.practice_bank.hand_checkable_count}`);
console.log(`  Other method family: ${report.practice_bank.other_method_count}`);
if (report.practice_bank.without_verification_method > 0) {
  console.log(`  No verification method at all: ${report.practice_bank.without_verification_method} — real gap, sample:`);
  for (const item of report.practice_bank.unmethoded_sample) {
    console.log(`    - ${item.id} (${item.bank})`);
  }
}
console.log('');
console.log(`Content bundle (exam-question PYQs): ${report.content_bundle.total_problems} problems`);
console.log(`  Wolfram-verified (automated sweep): ${report.content_bundle.wolfram_verified} (${pct(report.headline.automated_sweep_coverage_pct)})`);
console.log(`  Never yet swept: ${report.content_bundle.never_yet_swept}`);
console.log('  By topic:');
for (const [topic, counts] of Object.entries(report.content_bundle.by_topic)) {
  console.log(`    ${topic}: ${counts.wolfram_verified}/${counts.total} swept`);
}
if (report.caveats.length > 0) {
  console.log('');
  console.log('Caveats:');
  for (const c of report.caveats) console.log(`  - ${c}`);
}
console.log('');
