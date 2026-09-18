/**
 * src/registry/concept-anchors.ts
 *
 * Concept Anchors — the one plain sentence that says what a concept is FOR.
 *
 * Why this exists (see docs/designs/2026-09-18-concept-anchor-and-rendering-agenda.md):
 * every other framing surface on a lesson page is exam-framed by
 * construction. `AtomType` has eleven members and none answers "what is
 * this for in the world"; the atomic catalogue carries
 * `gate_examination_intent` + a module-level `primary_pain_point`;
 * `ped_property_first` literally directs "End with a one-line 'Why it
 * matters in GATE' callout". Measured across the corpus, ~2 of 101
 * concepts carried a genuine real-world bridge.
 *
 * This registry is the one home for that fact. It is deliberately NOT:
 *   - a twelfth AtomType (that adds a card, and card count is the binding
 *     constraint on a tired student's attention — it would make every
 *     constraint the design agenda names worse, not better);
 *   - a second copy of anything in data/curriculum/gate-em/atomic-catalogue.json
 *     (that stays exam-framed and untouched);
 *   - per-module (the catalogue's `primary_pain_point` is module-level, so
 *     all 26 LA atoms share one identical string — the generality trap this
 *     registry exists to avoid). Anchors are per-concept, always.
 *
 * Data lives in data/registry/concept-anchors/<topic>.yml, one file per
 * topic so parallel authoring never contends on a single file.
 *
 * The frontend does NOT import this module. Anchors reach the client through
 * frontend/scripts/generate-concept-anchors.ts, which emits an import-free
 * generated module — same discipline as intent-slices.gen.ts, so no backend
 * code is pulled into the Vite bundle.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Hard cap from the contract (§4 rule 1). Enforced by `validateAnchor`.
 *
 * CHARACTERS, not words, because characters are what decide rendered lines and
 * lines are what the "lack of space on screen" constraint is actually about.
 * The first cut of this contract capped words at 30; measured live at 375px
 * (the lede's real container is 261px wide at 17px/24.65px), all 100 authored
 * anchors came out at 5-7 lines — a paragraph at the top of every concept,
 * pushing the hook's own opening below the fold. 100 characters is ~3 lines
 * in that container, which is what "one sentence, first" was supposed to mean.
 *
 * A word cap on top of this would be dead code: 100 characters cannot hold a
 * paragraph. `countAnchorWords` stays for the gate's reporting only.
 */
export const MAX_ANCHOR_CHARS = 100;

export interface ConceptAnchor {
  concept_id: string;
  /** The sentence, or null when no honest real-world anchor exists. */
  anchor: string | null;
  /** Required when `anchor` is null — why there is nothing honest to say. */
  reason?: string;
  topic: string;
}

interface AnchorFile {
  version?: number;
  topic?: string;
  concepts?: Record<string, { anchor?: string | null; reason?: string }>;
}

const REGISTRY_DIR = path.resolve(process.cwd(), 'data/registry/concept-anchors');

/**
 * Prose word count. Anchors carry no fences, no notation and no markdown by
 * contract, so a whitespace split is the honest measure here — unlike
 * atom bodies, which need countProseWords' fence stripping.
 */
export function countAnchorWords(anchor: string): number {
  return anchor.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * The contract, as code. Returns every violation rather than the first, so
 * an author fixing one anchor sees all of its problems in one pass.
 *
 * Both the CI gate and the codegen call this — the rules are stated once.
 */
export function validateAnchor(anchor: string): string[] {
  const problems: string[] = [];
  const trimmed = anchor.trim();

  if (!trimmed) {
    return ['empty anchor (use `anchor: null` + `reason:` for an honest absence)'];
  }

  if (trimmed.length > MAX_ANCHOR_CHARS) {
    problems.push(
      `${trimmed.length} characters, cap is ${MAX_ANCHOR_CHARS} (~3 rendered lines at 375px)`,
    );
  }

  // Rule 4 — no mathematical notation. This is the one surface in the whole
  // corpus that must read with zero prerequisites, so the bar is literal:
  // no dollar-delimited math, no LaTeX command, no bare Greek.
  if (trimmed.includes('$')) problems.push('contains `$` (no math notation)');
  if (/\\[a-zA-Z]+/.test(trimmed)) problems.push('contains a LaTeX command (no math notation)');
  if (/[Ͱ-Ͽ]/.test(trimmed)) problems.push('contains a Greek letter (no math notation)');

  // Rule 5 — no exam framing. exam_pattern and the DPS already own that
  // register; this slot is the only non-exam thing on the page, and letting
  // exam language back in recreates ped_property_first's "Why it matters in
  // GATE" failure that this registry was built to answer.
  //
  // "GATE" is matched CASE-SENSITIVELY, on purpose. The exam is always
  // written in caps; a logic *gate* on a chip is lowercase — and a chip
  // designer counting logic gates is exactly the concrete, physical anchor
  // this contract is asking for. A case-insensitive check rejected that
  // real anchor on its first run, which is the false positive this comment
  // exists to stop anyone from reintroducing.
  const examCaps = trimmed.match(/\bGATE\b/);
  if (examCaps) problems.push('exam framing: "GATE"');
  const examFraming = trimmed.match(/\b(exams?|marks?|syllabus|high[- ]yield|commonly asked|previous year)\b/i);
  if (examFraming) problems.push(`exam framing: "${examFraming[0]}"`);

  // Rule 2, partially checkable: vague nouns instead of a concrete system.
  const vague = trimmed.match(/\b(many fields|various (?:fields|applications)|numerous applications|all of (?:science|engineering))\b/i);
  if (vague) problems.push(`vague instead of concrete: "${vague[0]}"`);

  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(trimmed)) problems.push('contains an emoji');

  return problems;
}

let cache: Map<string, ConceptAnchor> | null = null;

/**
 * Loads every topic file. A malformed or unreadable file is skipped with a
 * warning rather than throwing: a broken anchor file must never take the
 * lesson page down, and an absent anchor already renders as nothing.
 */
export function loadConceptAnchors(): Map<string, ConceptAnchor> {
  if (cache) return cache;

  const out = new Map<string, ConceptAnchor>();
  if (!existsSync(REGISTRY_DIR)) {
    cache = out;
    return out;
  }

  for (const file of readdirSync(REGISTRY_DIR).filter((f) => f.endsWith('.yml')).sort()) {
    const full = path.join(REGISTRY_DIR, file);
    let parsed: AnchorFile;
    try {
      parsed = yaml.load(readFileSync(full, 'utf8')) as AnchorFile;
    } catch (err) {
      console.warn(`[concept-anchors] skipping unparseable ${file}: ${(err as Error).message}`);
      continue;
    }
    if (!parsed || typeof parsed !== 'object' || !parsed.concepts) continue;

    const topic = parsed.topic ?? file.replace(/\.yml$/, '');
    for (const [conceptId, entry] of Object.entries(parsed.concepts)) {
      if (!entry || typeof entry !== 'object') continue;
      const anchor = typeof entry.anchor === 'string' && entry.anchor.trim() ? entry.anchor.trim() : null;
      out.set(conceptId, { concept_id: conceptId, anchor, reason: entry.reason, topic });
    }
  }

  cache = out;
  return out;
}

/** The sentence for one concept, or null (no entry, or an honest absence). */
export function getConceptAnchor(conceptId: string): string | null {
  return loadConceptAnchors().get(conceptId)?.anchor ?? null;
}

/** Test seam — the module-level cache would otherwise outlive a fixture. */
export function resetConceptAnchorCache(): void {
  cache = null;
}
