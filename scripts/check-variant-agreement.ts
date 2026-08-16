/**
 * scripts/check-variant-agreement.ts — CI walker.
 *
 * The rules themselves live in src/content/variant-agreement.ts, because the
 * generator has to apply the same ones before it writes a file. This is only
 * the part that walks the corpus and decides the exit code.
 */

import fs from 'node:fs';
import path from 'node:path';
import { CONCEPT_MAP } from '../src/constants/concept-graph';
import {
  parseAtom,
  checkPair,
  repeatedPhrases,
  type Violation,
} from '../src/content/variant-agreement';

// ── corpus walk ────────────────────────────────────────────────────────────

const CONCEPTS = path.join(process.cwd(), 'modules/project-vidhya-content/concepts');

function main(): void {
  if (!fs.existsSync(CONCEPTS)) {
    console.log('[variant-agreement] no concepts directory; nothing to check');
    return;
  }
  const violations: Violation[] = [];
  let pairs = 0;

  for (const concept of fs.readdirSync(CONCEPTS)) {
    const atomsDir = path.join(CONCEPTS, concept, 'atoms');
    if (!fs.existsSync(atomsDir)) continue;
    const files = fs.readdirSync(atomsDir).filter((f) => f.endsWith('.md'));

    for (const f of files) {
      const m = f.match(/^(.*)-(shaken|assured)\.md$/);
      if (!m) continue;
      const [, stem] = m;
      const basePath = path.join(atomsDir, `${stem}.md`);
      const rel = path.relative(process.cwd(), path.join(atomsDir, f));
      if (!fs.existsSync(basePath)) {
        violations.push({
          file: rel,
          rule: 'orphan-variant',
          detail: `no base atom at ${stem}.md`,
        });
        continue;
      }
      pairs++;
      violations.push(
        ...checkPair(
          fs.readFileSync(basePath, 'utf-8'),
          fs.readFileSync(path.join(atomsDir, f), 'utf-8'),
          rel,
        ),
      );
    }
  }

  // Repetition is a TOPIC-level property. Grouped per concept it measures
  // subject-matter overlap; grouped per topic it measures whether the cadence
  // has collapsed into a formula across different concepts.
  const byTopic = new Map<string, Array<{ file: string; body: string; concept: string }>>();
  const basesByTopic = new Map<string, string[]>();
  for (const concept of fs.readdirSync(CONCEPTS)) {
    const atomsDir = path.join(CONCEPTS, concept, 'atoms');
    if (!fs.existsSync(atomsDir)) continue;
    const topic =
      (CONCEPT_MAP.get(concept) as { topic?: string } | undefined)?.topic ?? concept;
    for (const f of fs.readdirSync(atomsDir)) {
      if (!f.endsWith('.md')) continue;
      const body = parseAtom(fs.readFileSync(path.join(atomsDir, f), 'utf-8')).body;
      const sm = f.match(/-(shaken|assured)\.md$/);
      if (sm) {
        // Keyed by (topic, stance): the cadence is written per stance, so
        // sameness WITHIN a stance is the signal. Pooling both stances halves
        // every ratio and hides the pattern — "one vector at a" is 2 of 8
        // shaken (25%) but only 2 of 16 variants (12.5%).
        const key = `${topic}/${sm[1]}`;
        if (!byTopic.has(key)) byTopic.set(key, []);
        byTopic.get(key)!.push({
          file: path.relative(process.cwd(), path.join(atomsDir, f)),
          body,
          concept,
        });
      } else {
        if (!basesByTopic.has(topic)) basesByTopic.set(topic, []);
        basesByTopic.get(topic)!.push(body);
      }
    }
  }
  for (const [topic, list] of byTopic) {
    for (const r of repeatedPhrases(list, basesByTopic.get(topic.split("/")[0]) ?? [])) {
      violations.push({
        file: r.files[0],
        rule: 'repeated-construction',
        detail: `"${r.phrase}" appears in ${r.files.length}/${list.length} of ${topic}'s variants: ${r.files.join(', ')}`,
      });
    }
  }

  console.log(`[variant-agreement] checked ${pairs} base/variant pairs`);
  if (violations.length === 0) {
    console.log('[variant-agreement] OK');
    return;
  }
  console.error(`\n[variant-agreement] FAIL — ${violations.length} violation(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}\n    [${v.rule}] ${v.detail}`);
  }
  console.error('');
  process.exit(1);
}

if (process.argv[1] && process.argv[1].endsWith('check-variant-agreement.ts')) {
  main();
}
