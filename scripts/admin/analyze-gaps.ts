// @ts-nocheck
/**
 * Admin CLI: analyze content gaps for one or all exams.
 *
 * Usage:
 *   npx tsx scripts/admin/analyze-gaps.ts                    # all exams
 *   npx tsx scripts/admin/analyze-gaps.ts --exam gate-ma     # one exam
 *   npx tsx scripts/admin/analyze-gaps.ts --cross             # cross-exam rollup
 *   npx tsx scripts/admin/analyze-gaps.ts --json              # JSON output
 *
 * Output is human-readable by default; pipe to less or use --json for
 * programmatic consumption.
 */

import { analyzeExamGaps, rollUpGapsAcrossExams } from '../../src/curriculum/gap-analyzer';
import { listExamIds, getExam } from '../../src/curriculum/exam-loader';

const args = process.argv.slice(2);
const examIdx = args.indexOf('--exam');
const explicitExam = examIdx >= 0 ? args[examIdx + 1] : null;
const crossMode = args.includes('--cross');
const jsonMode = args.includes('--json');

function barGraph(value: number, max: number, width = 20): string {
  const filled = Math.min(width, Math.round((value / max) * width));
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

function reportExam(exam_id: string) {
  const a = analyzeExamGaps(exam_id);
  if (!a) {
    console.error(`Exam "${exam_id}" not found — check data/curriculum/`);
    return;
  }
  if (jsonMode) { console.log(JSON.stringify(a, null, 2)); return; }

  console.log('');
  console.log(`═══ ${a.exam_name} (${a.exam_id}) ═══`);
  console.log(`${a.summary.complete} complete / ${a.summary.partial} partial / ${a.summary.empty} empty of ${a.total_concepts} concepts`);
  console.log('');

  if (a.gaps.length === 0) {
    console.log('  ✓ No gaps found — this exam is fully covered.');
    return;
  }

  console.log('  Priority | Concept                              | Missing');
  console.log('  ---------|--------------------------------------|----------------------------------------');
  for (const g of a.gaps) {
    const missingStrs: string[] = [];
    if (g.missing.explainer_body) missingStrs.push('explainer');
    if (g.missing.worked_examples) missingStrs.push('worked-examples');
    if (g.missing.misconceptions) missingStrs.push('misconceptions');
    if (g.missing.practice_problems_have < g.missing.practice_problems_target) {
      missingStrs.push(`practice ${g.missing.practice_problems_have}/${g.missing.practice_problems_target}`);
    }
    if (g.missing.wolfram_verified_have < g.missing.wolfram_verified_target) {
      missingStrs.push(`wolfram ${g.missing.wolfram_verified_have}/${g.missing.wolfram_verified_target}`);
    }
    console.log(`  ${pad(String(g.priority.toFixed(1)), 8)} | ${pad(g.concept_label, 36)} | ${missingStrs.join(', ')}`);
  }
}

function reportCross() {
  const ids = listExamIds();
  const rollup = rollUpGapsAcrossExams(ids);
  if (jsonMode) { console.log(JSON.stringify({ exam_ids: ids, gaps: rollup }, null, 2)); return; }

  console.log('');
  console.log('═══ Cross-Exam Gap Rollup ═══');
  console.log(`Concepts missing content across ${ids.length} exams (${ids.join(', ')})`);
  console.log('');
  console.log('  Priority | Concept                              | Exams affected | Missing');
  console.log('  ---------|--------------------------------------|----------------|---------------------');
  for (const g of rollup.slice(0, 30)) {
    console.log(
      `  ${pad(g.combined_priority.toFixed(1), 8)} | ${pad(g.concept_label, 36)} | ` +
      `${pad(String(g.affected_exams.length), 14)} | ${g.summary_missing.join(', ')}`
    );
  }
  if (rollup.length > 30) console.log(`  ... and ${rollup.length - 30} more concepts with gaps`);
}

function main() {
  if (crossMode) { reportCross(); return; }
  const targets = explicitExam ? [explicitExam] : listExamIds();
  if (targets.length === 0) {
    console.error('No exam definitions found. Add YAML files to data/curriculum/');
    return;
  }
  for (const id of targets) reportExam(id);
}

main();
