#!/usr/bin/env npx tsx
/**
 * scripts/eval-judge.ts
 *
 * Measures the judge against the labelled eval set before it is allowed to gate
 * 566 generated variants.
 *
 * The bar is in `eval-set.ts`: every one of the ten corruptions caught, and at
 * least 85% of the thirty legitimate rewrites accepted. Recall is absolute
 * because a judge that misses one corruption in ten misses roughly fifty-six
 * across the corpus, and each of those is a wrong statement a student reads as
 * fact. Precision has slack because a false rejection costs one human read.
 *
 * Exits non-zero when the bar is not met, so this can gate a generation run.
 *
 *   ANTHROPIC_API_KEY=… npx tsx scripts/eval-judge.ts
 *   npx tsx scripts/eval-judge.ts --verbose      # print every failure
 *
 * This has never been run against a live model in this repository — no
 * reachable provider is configured here. Until its output is recorded, the
 * judge is unvalidated.
 */

import { EVAL_PAIRS, scoreJudge, meetsPromotionBar, JUDGE_PROMOTION_BAR } from '../src/generation/eval-set';
import { makeJudge, type JudgeModel } from '../src/generation/variant-judge';

async function main(): Promise<void> {
  const verbose = process.argv.includes('--verbose');

  const { getLlmForRole } = await import('../src/llm/runtime');
  const llm = await getLlmForRole('json');
  if (!llm) {
    console.error('No LLM provider configured — cannot evaluate the judge.');
    console.error('Set one of GEMINI_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY / OPENROUTER_API_KEY.');
    process.exit(1);
  }
  console.log(`judge: ${llm.provider_id} / ${llm.model_id}`);
  console.log(`${EVAL_PAIRS.length} pairs, ${EVAL_PAIRS.filter((p) => !p.shouldAgree).length} corrupted\n`);

  const model: JudgeModel = { generate: (p) => llm.generate(p, { temperature: 0 }) };
  const result = await scoreJudge(makeJudge(model));

  console.log(`recall    ${result.recall.toFixed(2)}  (bar ${JUDGE_PROMOTION_BAR.recall})`);
  console.log(`precision ${result.precision.toFixed(2)}  (bar ${JUDGE_PROMOTION_BAR.precision})`);

  if (result.failures.length > 0) {
    console.log(`\n${result.failures.length} disagreements:`);
    for (const f of result.failures) {
      const dir = f.expected ? 'wrongly rejected' : 'MISSED';
      console.log(`  ${dir}  ${f.id}${f.corruption ? ` — ${f.corruption}` : ''}`);
      if (verbose && f.got === 'threw') console.log('    (the judge threw rather than answering)');
    }
  }

  if (meetsPromotionBar(result)) {
    console.log('\nPASS — this judge may gate generation.');
    return;
  }
  console.log('\nFAIL — do not let this judge gate generation.');
  if (result.recall < JUDGE_PROMOTION_BAR.recall) {
    console.log('Missed corruptions are the blocking failure: fix the rubric, not the bar.');
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
