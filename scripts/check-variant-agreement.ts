/**
 * scripts/check-variant-agreement.ts
 *
 * A stance variant is a REWRITE of already-verified content. This gate checks
 * the things a machine can check exactly, so the LLM judge only has to answer
 * the question a machine cannot: does the prose still assert the same maths.
 *
 * ── What is checkable, and what is not ──────────────────────────────────
 *
 * Display math is NOT a usable comparator. Measured across the 8 accepted
 * pairs, there is no containment relation in either direction — `intuition.md`
 * carries one `$$` block and `intuition-assured.md` carries none, while
 * `worked-example.md` carries none and its shaken variant carries seven. The
 * prose is SUPPOSED to differ; that is the entire point of a variant. So any
 * rule tuned loose enough to pass a genuine rewrite is also too loose to catch
 * a changed number.
 *
 * What does hold, across every accepted pair, is structure. Both files carry
 * the same fenced blocks. That is the invariant this gate enforces.
 *
 * ── The walkthrough carve-out ───────────────────────────────────────────
 *
 * Byte-identical for every fenced block would forbid a shaken variant from
 * carrying more scaffolding steps, which is the mechanism the whole stance
 * axis depends on. But "skip walkthroughs when comparing" would leave 105 of
 * 125 interactive blocks ungated for answer drift, reintroducing exactly the
 * failure this gate exists to prevent, in the component shaken students are
 * steered into by default.
 *
 * The spec separates the two cleanly, so this does too:
 *
 *   prompt, hint, title, caption   may differ     ← how you are guided
 *   answer, eqn                    pinned         ← the maths
 *
 * "Pinned" is a SUBSEQUENCE rule, not equality: every answer the base asserts
 * must still appear in the variant, in order, and the final answer must match.
 * Subsequence is what permits inserting intermediate steps.
 *
 * ── Creation ────────────────────────────────────────────────────────────
 *
 * `guided_walkthrough` exists on 96 of 97 `worked_example` bases but only 5 of
 * 97 `hook` and 5 of 97 `intuition` bases. Scaffolding-into-the-walkthrough is
 * therefore unavailable for 69% of variants unless the generator may author
 * one. It may, for `shaken` only — an assured variant adding scaffolding is
 * working against its own register. `manipulable` and `simulation` may never
 * be created, because an invented interactive is not a rewrite of anything.
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { countProseWords, ASSURED_PROSE_BUDGET } from '../src/content/prose-budget';
import { CONCEPT_MAP } from '../src/constants/concept-graph';

export type Stance = 'shaken' | 'assured';
export const VARIANT_STANCES: Stance[] = ['shaken', 'assured'];

export { ASSURED_PROSE_BUDGET };

/** Opening-phrase reuse allowed within one topic before it reads as a template. */
export const REPETITION_THRESHOLD = 0.2;
/** n for the n-gram repetition check. */
export const NGRAM_N = 4;

export interface Violation {
  file: string;
  rule: string;
  detail: string;
}

// ── parsing ────────────────────────────────────────────────────────────────

export interface ParsedAtom {
  id?: string;
  concept_id?: string;
  atom_type?: string;
  variant_of?: string;
  for_stance?: string;
  body: string;
}

export function parseAtom(raw: string): ParsedAtom {
  const p = matter(raw);
  const d = p.data as Record<string, unknown>;
  return {
    id: d.id as string | undefined,
    concept_id: d.concept_id as string | undefined,
    atom_type: d.atom_type as string | undefined,
    variant_of: d.variant_of as string | undefined,
    for_stance: d.for_stance as string | undefined,
    body: p.content.trim(),
  };
}

export interface FencedBlock {
  /** Fence info string, e.g. `interactive-spec` or `gif-scene`. */
  lang: string;
  /** Raw inner text, used for byte comparison. */
  raw: string;
  /** Parsed JSON when the block is a well-formed spec, else null. */
  spec: Record<string, unknown> | null;
}

export function fencedBlocks(body: string): FencedBlock[] {
  const out: FencedBlock[] = [];
  const re = /```([a-z-]*)\s*\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const [, lang, raw] = m;
    let spec: Record<string, unknown> | null = null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') spec = parsed as Record<string, unknown>;
    } catch {
      /* not JSON — byte comparison still applies */
    }
    out.push({ lang, raw, spec });
  }
  return out;
}

// ── prose + structure ──────────────────────────────────────────────────────

/** Headings at any level, as `#` counts. */
export function headingLevels(body: string): number[] {
  return [...body.matchAll(/^(#{1,6})\s+\S/gm)].map((m) => m[1].length);
}

/**
 * Emoji, as distinct from typographic symbols.
 *
 * The first version of this used `\u{2600}-\u{27BF}` and immediately flagged
 * five accepted files. The offending character was U+2713 CHECK MARK — which
 * is Dingbats, not emoji, and is legitimate in a worked example that ticks off
 * a verification step. A gate that cries wolf gets switched off, so the range
 * matters more than it looks.
 *
 * The real distinction is PRESENTATION. `✓` is text presentation; `✓️` is the
 * same code point followed by U+FE0F VARIATION SELECTOR-16 requesting emoji
 * presentation. So: the unambiguous pictographic planes always count, and the
 * shared symbol ranges count only when explicitly asked to render as emoji.
 */
const EMOJI_RE = new RegExp(
  [
    '[\\u{1F300}-\\u{1FAFF}]', // pictographs, emoticons, transport, supplemental
    '[\\u{1F1E6}-\\u{1F1FF}]', // regional indicators (flags)
    '[\\u{2600}-\\u{27BF}]\\u{FE0F}', // dingbats/misc ONLY in emoji presentation
    '\\u{FE0F}', // an explicit emoji-presentation request anywhere
  ].join('|'),
  'u',
);

export function hasEmoji(body: string): boolean {
  return EMOJI_RE.test(body);
}

/**
 * Repeated phrases across a topic's variants, position-INDEPENDENT.
 *
 * The first version of this rule checked opening 4-grams, justified by
 * "one X at a time" opening 3 of 8 shaken variants. It caught none of them:
 * their openings are `One vector at a`, `A $3\times3$ determinant, one` and
 * `Gram-Schmidt, one vector at`. No two share an opening 4-gram, because the
 * repeated idiom is TRAILING and sits at three different offsets.
 *
 * So the check runs over every n-gram in each file's headings and prose, and
 * flags any that recurs in more than `threshold` of the topic's variants.
 */
function ngrams(body: string, n: number): Set<string> {
  const text = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^\n$]*\$/g, ' ')
    .replace(/[#*`_>]/g, ' ')
    .toLowerCase();
  const words = text.split(/[^a-z0-9]+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join(' '));
  return out;
}

/** Below this many variants, phrase recurrence is noise rather than a pattern. */
export const MIN_FILES_FOR_REPETITION = 8;

export function repeatedPhrases(
  files: Array<{ file: string; body: string; concept: string }>,
  baseBodies: string[] = [],
  threshold = REPETITION_THRESHOLD,
  n = NGRAM_N,
): Array<{ phrase: string; files: string[] }> {
  // Small-n guard. Grouped per concept there are only 5-6 variants, where a
  // 20% threshold fails on any phrase shared by two files — and two files
  // about determinants will inevitably share "the determinant of the". That
  // is the topic's vocabulary, not a cadence tic. The check is meaningful
  // across a TOPIC's variants, not a single concept's.
  if (files.length < MIN_FILES_FOR_REPETITION) return [];

  // Subject-matter vocabulary appears in the BASE atoms too. Subtracting the
  // bases isolates the constructions the cadence introduced, which is the
  // only thing worth flagging — "one vector at a time" is a tic; "the
  // characteristic polynomial of" is just what the topic is called.
  const baseGrams = new Set<string>();
  for (const b of baseBodies) for (const g of ngrams(b, n)) baseGrams.add(g);

  // Keyed by CONCEPT, not by file. A phrase recurring across determinants'
  // three variants is that concept's subject matter; the same phrase turning
  // up in determinants AND eigenvalues AND orthogonality is the cadence
  // collapsing into a formula. Only the second is worth flagging.
  const owners = new Map<string, Set<string>>();
  const exemplar = new Map<string, string[]>();
  const concepts = new Set(files.map((f) => f.concept));
  for (const { file, body, concept } of files) {
    for (const g of ngrams(body, n)) {
      if (baseGrams.has(g)) continue;
      if (!owners.has(g)) { owners.set(g, new Set()); exemplar.set(g, []); }
      owners.get(g)!.add(concept);
      exemplar.get(g)!.push(file);
    }
  }

  const limit = concepts.size * threshold;
  const out: Array<{ phrase: string; files: string[] }> = [];
  for (const [phrase, cs] of owners) {
    if (cs.size > limit && cs.size > 1) {
      out.push({ phrase, files: [...new Set(exemplar.get(phrase)!)].sort() });
    }
  }
  out.sort((a, b) => b.files.length - a.files.length || a.phrase.localeCompare(b.phrase));
  return out;
}

// ── the comparison ─────────────────────────────────────────────────────────

function stepsOf(spec: Record<string, unknown> | null): Array<Record<string, unknown>> {
  const s = spec?.steps;
  return Array.isArray(s) ? (s as Array<Record<string, unknown>>) : [];
}

/** Is `needle` an ordered subsequence of `hay`? */
export function isSubsequence(needle: string[], hay: string[]): boolean {
  let i = 0;
  for (const h of hay) {
    if (i < needle.length && needle[i] === h) i++;
  }
  return i === needle.length;
}

export function compareWalkthrough(
  base: FencedBlock,
  variant: FencedBlock,
  file: string,
): Violation[] {
  const v: Violation[] = [];
  if (!base.spec || !variant.spec) {
    // Refusing beats guessing: an unparseable spec means the gate cannot tell
    // whether the maths moved, and "cannot tell" must not read as "fine".
    v.push({
      file,
      rule: 'spec-unparseable',
      detail: 'interactive-spec is not parseable JSON in base or variant; refusing the variant',
    });
    return v;
  }
  if (base.spec.kind !== variant.spec.kind) {
    v.push({
      file,
      rule: 'spec-kind-changed',
      detail: `base kind "${base.spec.kind}" vs variant "${variant.spec.kind}"`,
    });
    return v;
  }

  const field = (s: Record<string, unknown>, k: string) =>
    stepsOf(s).map((st) => String(st[k] ?? ''));

  for (const key of ['answer', 'eqn'] as const) {
    const b = field(base.spec, key).filter(Boolean);
    const x = field(variant.spec, key).filter(Boolean);
    if (b.length === 0) continue;
    if (!isSubsequence(b, x)) {
      v.push({
        file,
        rule: `walkthrough-${key}-dropped`,
        detail: `the base's ${key} sequence is not preserved in order by the variant`,
      });
    }
  }

  const bAns = field(base.spec, 'answer').filter(Boolean);
  const xAns = field(variant.spec, 'answer').filter(Boolean);
  if (bAns.length && xAns.length && bAns[bAns.length - 1] !== xAns[xAns.length - 1]) {
    v.push({
      file,
      rule: 'walkthrough-final-answer-changed',
      detail: `final answer "${bAns[bAns.length - 1]}" became "${xAns[xAns.length - 1]}"`,
    });
  }
  return v;
}

export function compareBlocks(
  baseBlocks: FencedBlock[],
  variantBlocks: FencedBlock[],
  stance: Stance,
  file: string,
): Violation[] {
  const v: Violation[] = [];

  // Creation: only a shaken variant may ADD a walkthrough the base lacks.
  if (variantBlocks.length > baseBlocks.length) {
    const added = variantBlocks.slice(baseBlocks.length);
    for (const a of added) {
      const kind = a.spec?.kind;
      if (kind !== 'guided_walkthrough') {
        v.push({
          file,
          rule: 'interactive-invented',
          detail: `variant adds a "${kind ?? a.lang}" block; only guided_walkthrough may be added`,
        });
      } else if (stance !== 'shaken') {
        v.push({
          file,
          rule: 'assured-added-scaffolding',
          detail: 'only a shaken variant may add a guided_walkthrough',
        });
      }
    }
  }

  if (variantBlocks.length < baseBlocks.length) {
    v.push({
      file,
      rule: 'interactive-dropped',
      detail: `base has ${baseBlocks.length} fenced blocks, variant has ${variantBlocks.length}`,
    });
    return v;
  }

  for (let i = 0; i < baseBlocks.length; i++) {
    const b = baseBlocks[i];
    const x = variantBlocks[i];
    const isWalkthrough =
      b.spec?.kind === 'guided_walkthrough' || x.spec?.kind === 'guided_walkthrough';
    if (isWalkthrough) {
      v.push(...compareWalkthrough(b, x, file));
    } else if (b.raw.trim() !== x.raw.trim()) {
      // manipulable / simulation / gif-scene: byte-identical. A slider whose
      // range differs between two students on the same atom is drift, and the
      // authored files claim this invariant only in a comment today.
      v.push({
        file,
        rule: 'interactive-not-identical',
        detail: `${b.lang || 'fenced'} block ${i} differs from base; only guided_walkthrough may differ`,
      });
    }
  }
  return v;
}

export function checkPair(
  baseRaw: string,
  variantRaw: string,
  file: string,
): Violation[] {
  const base = parseAtom(baseRaw);
  const variant = parseAtom(variantRaw);
  const v: Violation[] = [];

  const stance = variant.for_stance as Stance;
  if (!VARIANT_STANCES.includes(stance)) {
    v.push({
      file,
      rule: 'bad-for-stance',
      detail: `for_stance must be one of ${VARIANT_STANCES.join(' | ')}, got "${variant.for_stance}"`,
    });
    return v;
  }
  if (!variant.variant_of) {
    v.push({ file, rule: 'missing-variant-of', detail: 'variant_of is not set' });
    return v;
  }
  if (variant.concept_id !== base.concept_id) {
    v.push({
      file,
      rule: 'concept-id-mismatch',
      detail: `variant concept_id "${variant.concept_id}" vs base "${base.concept_id}"`,
    });
  }
  if (variant.atom_type !== base.atom_type) {
    v.push({
      file,
      rule: 'atom-type-mismatch',
      detail: `variant atom_type "${variant.atom_type}" vs base "${base.atom_type}"`,
    });
  }

  // Prose budget.
  const baseWords = countProseWords(base.body);
  const varWords = countProseWords(variant.body);
  if (stance === 'shaken') {
    if (varWords > baseWords) {
      v.push({
        file,
        rule: 'shaken-longer-than-base',
        detail: `${varWords} prose words vs base ${baseWords}; a shaken variant must not be longer than what it replaces`,
      });
    }
  } else {
    const cap = ASSURED_PROSE_BUDGET[variant.atom_type ?? ''] ?? Infinity;
    if (varWords > cap) {
      v.push({
        file,
        rule: 'assured-over-budget',
        detail: `${varWords} prose words exceeds the ${variant.atom_type} ceiling of ${cap}`,
      });
    }
  }

  // Headings.
  const bH = headingLevels(base.body);
  const xH = headingLevels(variant.body);
  if (xH.some((l) => l === 1)) {
    v.push({
      file,
      rule: 'h1-in-atom-body',
      detail: 'h1 renders at 22px and competes with the page hierarchy; use h2 or lower',
    });
  }
  if (xH.length > bH.length + 1) {
    v.push({
      file,
      rule: 'too-many-headings',
      detail: `${xH.length} headings vs base ${bH.length}; cap is base + 1`,
    });
  }

  if (hasEmoji(variant.body)) {
    v.push({ file, rule: 'emoji', detail: 'the design system permits no emoji anywhere' });
  }

  v.push(...compareBlocks(fencedBlocks(base.body), fencedBlocks(variant.body), stance, file));
  return v;
}

// ── corpus walk ────────────────────────────────────────────────────────────

const CONCEPTS = path.join(process.cwd(), 'modules/project-vidhya-content/concepts');

export function main(): void {
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
