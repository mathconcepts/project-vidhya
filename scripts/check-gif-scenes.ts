#!/usr/bin/env npx tsx
/**
 * check-gif-scenes — validate every ```gif-scene``` block in the content
 * module against the renderer that actually serves them.
 *
 * Why this exists: the 4 Linear Algebra + 6 other `gif-scene` blocks that
 * shipped broken (§4.15 follow-up) rotted silently for the same reason
 * `lint-interactive-specs.ts` was written for `interactive-spec` blocks —
 * `demo/seed-media.ts` only renders these at deploy time and logs failures
 * to stdout that nobody reads. Nothing in CI parsed the JSON, let alone
 * rendered it, so a typo'd field name (`x_expr` vs `expression`) or an
 * unbound variable shipped straight to a demo audience.
 *
 * It deliberately calls the REAL `renderScene()` from gif-generator.ts
 * rather than re-checking field shapes by hand — a second copy of "what
 * makes a scene valid" is exactly how these ten scenes drifted from what
 * the renderer supports in the first place. A block passes here iff
 * `renderScene()` would produce a GIF for it, full stop.
 *
 * Pre-existing failures are grandfathered in gif-scene-baseline.json
 * (mirrors golden-answer-key-baseline.json / fork-test-lint-baseline.json)
 * so the gate blocks NEW breakage without blocking on debt nobody has
 * signed up to fix yet. The baseline may only shrink — anything on it that
 * starts passing must be removed, and anything newly broken that isn't on
 * it fails the build.
 *
 * W3.6/E9 media QA pass: every scene that renders is also checked for
 * `renderScene()`'s `qa.hard_fail` (label overlap or a near-blank frame on
 * the FINAL sampled frame — see gif-generator.ts's evaluateSceneQa). This
 * is a SEPARATE finding class from render failure — `known_broken_scenes`
 * means "would not render at all"; a QA hard-fail means "rendered fine but
 * is not legible/visible". Pre-existing QA failures are grandfathered
 * under the baseline's `qa_grandfathered` key (a key → reason map, not a
 * bare list, so the reason travels with the entry instead of living only
 * in a commit message). Same shrink-only contract as known_broken_scenes.
 *
 * Usage:
 *   npx tsx scripts/check-gif-scenes.ts            # gate all content
 *   npx tsx scripts/check-gif-scenes.ts --report-only
 *   npx tsx scripts/check-gif-scenes.ts --dir path  # scope to a subtree
 *   npx tsx scripts/check-gif-scenes.ts --baseline path.json  # test-only override
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  renderScene,
  isKnownSceneType,
  type SceneDescription,
} from '../src/content/concept-orchestrator/gif-generator.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_DIR = path.join(ROOT, 'modules/project-vidhya-content/concepts');
const BASELINE_PATH = path.join(__dirname, 'gif-scene-baseline.json');

interface Failure {
  key: string;
  reason: string;
}

interface Baseline {
  known_broken_scenes: Set<string>;
  qa_grandfathered: Record<string, string>;
}

function loadBaseline(baselinePath: string): Baseline {
  if (!fs.existsSync(baselinePath)) return { known_broken_scenes: new Set(), qa_grandfathered: {} };
  try {
    const parsed = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    return {
      known_broken_scenes: new Set<string>(parsed.known_broken_scenes ?? []),
      qa_grandfathered: parsed.qa_grandfathered ?? {},
    };
  } catch {
    return { known_broken_scenes: new Set(), qa_grandfathered: {} };
  }
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

/** Every fenced gif-scene block in a file, in document order. */
function extractGifSceneBlocks(body: string): string[] {
  const blocks: string[] = [];
  const re = /```gif-scene\s*\n([\s\S]*?)\n```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) blocks.push(m[1]);
  return blocks;
}

interface QaFinding {
  key: string;
  reasons: string[];
  ink_density_final: number;
  contrast_final: number;
}

function main(): void {
  const argv = process.argv.slice(2);
  const dirFlag = argv.indexOf('--dir');
  const target = dirFlag >= 0 ? path.resolve(argv[dirFlag + 1]) : DEFAULT_DIR;
  const reportOnly = argv.includes('--report-only');
  const baselineFlag = argv.indexOf('--baseline');
  const baselinePath = baselineFlag >= 0 ? path.resolve(argv[baselineFlag + 1]) : BASELINE_PATH;

  if (!fs.existsSync(target)) {
    console.error(`check-gif-scenes: no such directory: ${target}`);
    process.exit(1);
  }

  const baseline = loadBaseline(baselinePath);
  const failures: Failure[] = [];
  const passingKeys = new Set<string>();
  const qaFindings: QaFinding[] = [];
  let sceneCount = 0;

  for (const file of walk(target)) {
    const body = fs.readFileSync(file, 'utf8');
    const blocks = extractGifSceneBlocks(body);
    if (blocks.length === 0) continue;

    const relPath = path.relative(ROOT, file);
    blocks.forEach((raw, idx) => {
      const key = blocks.length > 1 ? `${relPath}::block${idx}` : relPath;
      sceneCount++;

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        failures.push({ key, reason: `malformed JSON: ${(e as Error).message}` });
        return;
      }

      if (!parsed || typeof parsed !== 'object' || !isKnownSceneType((parsed as any).type)) {
        failures.push({ key, reason: `unknown or missing scene "type": ${JSON.stringify((parsed as any)?.type)}` });
        return;
      }

      try {
        // Cap frames so a slow scene doesn't blow up gate runtime — the
        // gate cares whether every frame *would* render, not the final
        // GIF's size, and renderFrame's per-frame cost doesn't depend on
        // frame count.
        const scene = { ...(parsed as SceneDescription), frames: Math.min((parsed as any).frames ?? 30, 6) };
        const result = renderScene(scene);
        passingKeys.add(key);
        const finalSample = result.qa.samples.find((s) => s.role === 'final') ?? result.qa.samples[result.qa.samples.length - 1];
        qaFindings.push({
          key,
          reasons: result.qa.hard_fail_reasons,
          ink_density_final: finalSample?.ink_density ?? 0,
          contrast_final: finalSample?.contrast ?? 0,
        });
      } catch (e) {
        failures.push({ key, reason: (e as Error).message });
      }
    });
  }

  const newFailures = failures.filter((f) => !baseline.known_broken_scenes.has(f.key));
  const grandfathered = failures.filter((f) => baseline.known_broken_scenes.has(f.key));
  const staleBaselineEntries = [...baseline.known_broken_scenes].filter((k) => passingKeys.has(k));

  // W3.6/E9 media QA pass — separate finding class from render failure
  // above. A scene that renders can still hard-fail QA (label overlap or
  // near-blank on the final sampled frame).
  const qaFailing = qaFindings.filter((f) => f.reasons.length > 0);
  const qaGrandfathered = qaFailing.filter((f) => Object.prototype.hasOwnProperty.call(baseline.qa_grandfathered, f.key));
  const newQaFailures = qaFailing.filter((f) => !Object.prototype.hasOwnProperty.call(baseline.qa_grandfathered, f.key));
  const staleQaBaselineEntries = Object.keys(baseline.qa_grandfathered).filter(
    (k) => passingKeys.has(k) && !qaFailing.some((f) => f.key === k),
  );

  console.log(`check-gif-scenes: ${sceneCount} gif-scene block(s) checked under ${path.relative(ROOT, target)}`);
  if (grandfathered.length > 0) {
    console.log(`  ${grandfathered.length} pre-existing failure(s) grandfathered via gif-scene-baseline.json:`);
    for (const f of grandfathered) console.log(`    - ${f.key}: ${f.reason}`);
  }

  if (staleBaselineEntries.length > 0) {
    // Not a build failure — a shrinking baseline is exactly what we want —
    // but flag it loudly so someone actually deletes the stale entry
    // instead of the list only ever growing.
    console.log(
      `\n  note: ${staleBaselineEntries.length} baseline entr(y/ies) now render successfully and should be ` +
        `removed from gif-scene-baseline.json:`,
    );
    for (const k of staleBaselineEntries) console.log(`    - ${k}`);
  }

  // Per-scene QA table — every scene that rendered, not just failures, so
  // this is a genuine report, not just a failure list.
  console.log(`\ncheck-gif-scenes: media QA pass over ${qaFindings.length} rendered scene(s):`);
  console.log(`  ${'scene'.padEnd(56)} ink(final)  contrast(final)  status`);
  for (const f of qaFindings) {
    const status = f.reasons.length === 0
      ? 'ok'
      : Object.prototype.hasOwnProperty.call(baseline.qa_grandfathered, f.key) ? 'grandfathered' : 'FAIL';
    console.log(
      `  ${f.key.padEnd(56)} ${f.ink_density_final.toFixed(4).padStart(10)}  ${f.contrast_final.toFixed(4).padStart(15)}  ${status}`,
    );
  }
  if (qaGrandfathered.length > 0) {
    console.log(`\n  ${qaGrandfathered.length} pre-existing QA failure(s) grandfathered via gif-scene-baseline.json's qa_grandfathered:`);
    for (const f of qaGrandfathered) {
      console.log(`    - ${f.key}: ${baseline.qa_grandfathered[f.key]}`);
      for (const r of f.reasons) console.log(`        ${r}`);
    }
  }
  if (staleQaBaselineEntries.length > 0) {
    console.log(
      `\n  note: ${staleQaBaselineEntries.length} qa_grandfathered entr(y/ies) now pass QA and should be ` +
        `removed from gif-scene-baseline.json:`,
    );
    for (const k of staleQaBaselineEntries) console.log(`    - ${k}`);
  }

  const hasBlockingFailures = newFailures.length > 0 || newQaFailures.length > 0;

  if (newFailures.length > 0) {
    console.error(`\n✗ ${newFailures.length} gif-scene block(s) would not render:\n`);
    for (const f of newFailures) console.error(`  ${f.key}\n      ${f.reason}`);
    console.error('');
  }

  if (newQaFailures.length > 0) {
    console.error(`\n✗ ${newQaFailures.length} gif-scene block(s) failed media QA (not in qa_grandfathered):\n`);
    for (const f of newQaFailures) {
      console.error(`  ${f.key}`);
      for (const r of f.reasons) console.error(`      ${r}`);
    }
    console.error('');
  }

  if (hasBlockingFailures) {
    if (reportOnly) {
      console.error('(--report-only: not failing the build)');
      process.exit(0);
    }
    process.exit(1);
  }

  console.log(
    `\n✓ ${sceneCount - grandfathered.length} gif-scene block(s) render cleanly (${grandfathered.length} known-broken, baselined); ` +
      `${qaFindings.length - qaFailing.length} pass media QA cleanly (${qaGrandfathered.length} known QA issue(s), baselined)`,
  );
}

main();
