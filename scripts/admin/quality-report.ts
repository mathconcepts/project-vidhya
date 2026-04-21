// @ts-nocheck
/**
 * Admin CLI: quality report — show compounding quality metrics.
 *
 * Usage:
 *   npx tsx scripts/admin/quality-report.ts              # current snapshot
 *   npx tsx scripts/admin/quality-report.ts --trend      # iteration-over-iteration
 *   npx tsx scripts/admin/quality-report.ts --flagged    # only flagged components
 *   npx tsx scripts/admin/quality-report.ts --close      # close current iteration
 *   npx tsx scripts/admin/quality-report.ts --json       # JSON output
 */

import {
  getCurrentQualityView,
  getIterationTrend,
  getFlaggedComponents,
  closeIterationAndStartNext,
} from '../../src/curriculum/quality-aggregator';

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const trendMode = args.includes('--trend');
const flaggedMode = args.includes('--flagged');
const closeMode = args.includes('--close');

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

function scoreBar(score: number, width = 20): string {
  const filled = Math.round(score * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function reportCurrent() {
  const snap = getCurrentQualityView();
  if (jsonMode) { console.log(JSON.stringify(snap, null, 2)); return; }

  console.log('');
  console.log(`═══ Quality Snapshot — Iteration ${snap.iteration} ═══`);
  console.log(`  Started:         ${snap.started_at}`);
  console.log(`  Components:      ${snap.total_components}`);
  console.log(`  Avg quality:     ${snap.avg_quality_score.toFixed(2)} ${scoreBar(snap.avg_quality_score)}`);
  console.log(`  Flagged:         ${snap.flagged_count}`);
  if (snap.delta_vs_previous !== null) {
    const arrow = snap.delta_vs_previous > 0 ? '▲' : snap.delta_vs_previous < 0 ? '▼' : '→';
    console.log(`  Δ vs prev:       ${arrow} ${snap.delta_vs_previous >= 0 ? '+' : ''}${snap.delta_vs_previous.toFixed(2)}`);
  }
  console.log('');
  if (snap.per_concept.length === 0) {
    console.log('  No engagement signals recorded yet. Students need to interact with lessons first.');
    return;
  }
  console.log('  Score | Concept                        | Component           | Obs | Skip% | Notes');
  console.log('  ------|--------------------------------|---------------------|-----|-------|---------------------');
  for (const c of snap.per_concept.slice(0, 25)) {
    console.log(
      `  ${c.quality_score.toFixed(2)}  | ${pad(c.concept_id, 30)} | ${pad(c.component_kind, 19)} | ` +
      `${pad(String(c.observations), 3)} | ${pad(String(Math.round(c.engagement.skip_rate * 100)) + '%', 5)} | ` +
      `${c.flag_reason || ''}`
    );
  }
  if (snap.per_concept.length > 25) {
    console.log(`  ... and ${snap.per_concept.length - 25} more components`);
  }
}

function reportTrend() {
  const trend = getIterationTrend();
  if (jsonMode) { console.log(JSON.stringify({ trend }, null, 2)); return; }

  console.log('');
  console.log('═══ Iteration-over-Iteration Trend ═══');
  if (trend.length === 0) {
    console.log('  No completed iterations yet — run --close to finalize the current one.');
    return;
  }
  console.log('');
  console.log('  Iter | Avg Score | Flagged | Ended');
  console.log('  -----|-----------|---------|----------------------');
  for (const t of trend) {
    console.log(`  ${pad(String(t.iteration), 4)} | ${t.avg_quality_score.toFixed(2)} ${scoreBar(t.avg_quality_score, 10)} | ${pad(String(t.flagged_count), 7)} | ${t.ended_at}`);
  }
}

function reportFlagged() {
  const flagged = getFlaggedComponents();
  if (jsonMode) { console.log(JSON.stringify({ flagged }, null, 2)); return; }

  console.log('');
  console.log(`═══ Flagged Components (${flagged.length} needing curator attention) ═══`);
  if (flagged.length === 0) {
    console.log('  ✓ No components currently below the quality threshold.');
    return;
  }
  console.log('');
  for (const c of flagged) {
    console.log(`  • ${c.concept_id} / ${c.component_kind}`);
    console.log(`    Score: ${c.quality_score.toFixed(2)}   Observations: ${c.observations}`);
    console.log(`    Skip rate: ${(c.engagement.skip_rate * 100).toFixed(0)}%   Completion: ${(c.engagement.completion_rate * 100).toFixed(0)}%`);
    if (c.engagement.micro_exercise_success_rate !== null) {
      console.log(`    Micro-exercise success: ${(c.engagement.micro_exercise_success_rate * 100).toFixed(0)}%`);
    }
    console.log(`    Reason: ${c.flag_reason}`);
    console.log('');
  }
}

function doClose() {
  const snap = closeIterationAndStartNext();
  if (jsonMode) { console.log(JSON.stringify(snap, null, 2)); return; }
  console.log('');
  console.log(`✓ Closed iteration ${snap.iteration}`);
  console.log(`  Final avg score: ${snap.avg_quality_score.toFixed(2)}`);
  console.log(`  Flagged components: ${snap.flagged_count}`);
  console.log(`  Total observations: ${snap.per_concept.reduce((s, c) => s + c.observations, 0)}`);
  if (snap.delta_vs_previous !== null) {
    const arrow = snap.delta_vs_previous > 0 ? '▲' : snap.delta_vs_previous < 0 ? '▼' : '→';
    console.log(`  Δ vs previous iteration: ${arrow} ${snap.delta_vs_previous >= 0 ? '+' : ''}${snap.delta_vs_previous.toFixed(2)}`);
  }
  console.log('');
  console.log('  A new iteration has begun. Next engagement signals count toward it.');
}

function main() {
  if (closeMode) { doClose(); return; }
  if (trendMode) { reportTrend(); return; }
  if (flaggedMode) { reportFlagged(); return; }
  reportCurrent();
}

main();
