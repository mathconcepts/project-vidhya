#!/usr/bin/env npx tsx
/**
 * scripts/check-practice-items.ts — E9 practice-item factory CI gate.
 *
 * Two independent checks over every `data/practice-items/*.json` bank:
 *
 *   1. STRICT SCHEMA VALIDATION — every field the marking columns need,
 *      including `answer_index`/`answer_indices` pointing INSIDE the
 *      item's own `options` array. An off-by-one here marks a correct
 *      student wrong, which is the worst thing a gradable item can do.
 *   2. DETERMINISTIC RE-GRADE — every item is graded against its OWN
 *      correct answer via `src/scoring/deterministic-scorer.ts` (the
 *      exact scorer `/api/practice/attempt` uses) and must earn full
 *      marks. A committed item that cannot grade its own correct answer
 *      to full credit is broken, whatever its schema says.
 *
 * A file that fails to PARSE (malformed JSON) fails the gate loudly —
 * mirrors the same fix in scripts/check-syllabus-floor.ts's
 * loadPracticeCounts: a bank nobody can read must never silently count
 * as "no items here".
 *
 * W1.2/E10/D10 additions (2026-08-27):
 *
 *   3. `evidence_level`, when present, is one of AuthoredItem's four locked
 *      values (src/scoring/learning-object-catalog-file.ts). Absence is
 *      fine — it's optional structured provenance, not a required field.
 *   4. PYQ BANK SCHEMA — frontend/public/data/pyq-bank.json is loaded and
 *      validated too: every problem's optional `evidence_level` is
 *      enum-checked the same way. This is the natural home for that check
 *      (over check-intent-catalogue.ts, the other candidate) because a PYQ
 *      bank entry is structurally a practice item — question_text, options,
 *      correct_answer, marks — not demand-side catalogue/routing data.
 *   5. PHRASE RULE — neither bank's question_text/solution_steps
 *      (practice-items) or question_text/explanation (PYQ bank) may say
 *      "high-yield" / "frequently asked" / "most repeated" / "often asked"
 *      UNLESS that item's `evidence_level` is `directly_reviewed`. See
 *      src/content/evidence-phrase-rule.ts (shared with
 *      check-intent-catalogue.ts's A8/B6 checks over the demand-side
 *      catalogue — one phrase list, two scoped gates).
 *
 * Usage: npx tsx scripts/check-practice-items.ts
 * Exit: 0 = every item schema-valid + self-re-grades to full marks + PYQ
 *           bank schema-valid + phrase rule holds across both banks.
 *       1 = at least one problem (or a bank failed to parse).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  GateDeterministicScorer,
  type GateItem,
  type GateItemKind,
  type GateResponse,
} from '../src/scoring/deterministic-scorer';
import { parseNumericAnswer } from '../src/gbrain/marking-derivation';
import { EVIDENCE_LEVELS, type AuthoredItem } from '../src/scoring/learning-object-catalog-file';
import { ALL_CONCEPTS } from '../src/constants/concept-graph';
import { findForbiddenPhrases, evidenceLevelLicensesClaim } from '../src/content/evidence-phrase-rule';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_ITEMS_DIR = path.join(ROOT, 'data', 'practice-items');
const DEFAULT_PYQ_BANK_PATH = path.join(ROOT, 'frontend', 'public', 'data', 'pyq-bank.json');

const VALID_KINDS = new Set(['mcq', 'msq', 'nat']);
const EVIDENCE_LEVEL_SET: ReadonlySet<string> = new Set(EVIDENCE_LEVELS);

/** Known concept ids — `also_tests` entries must name a real concept. */
const KNOWN_CONCEPT_IDS = new Set(ALL_CONCEPTS.map((c) => c.id));

// ---------------------------------------------------------------------------
// Loading — a parse failure THROWS (never silently contributes "0 items").
// ---------------------------------------------------------------------------

export interface LoadedBank {
  file: string;
  items: unknown[];
}

export function loadAllPracticeItemBanks(dir: string = DEFAULT_ITEMS_DIR): LoadedBank[] {
  if (!fs.existsSync(dir)) return [];
  const out: LoadedBank[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    // Deliberately no try/catch here — a malformed bank must fail the
    // gate loudly, not be swallowed into an empty result.
    const raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8')) as { items?: unknown[] };
    if (!Array.isArray(raw.items)) {
      throw new Error(`${file}: no "items" array (or it is not an array)`);
    }
    out.push({ file, items: raw.items });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

/** Returns a list of human-readable problems; empty = schema-valid. */
export function validateItemSchema(raw: unknown): string[] {
  if (typeof raw !== 'object' || raw === null) return ['item is not an object'];
  const it = raw as Record<string, unknown>;
  const problems: string[] = [];

  if (typeof it.id !== 'string' || it.id.length === 0) problems.push('id missing or not a non-empty string');
  if (typeof it.concept_id !== 'string' || it.concept_id.length === 0) {
    problems.push('concept_id missing or not a non-empty string');
  }
  if (typeof it.question_text !== 'string' || it.question_text.trim().length === 0) {
    problems.push('question_text missing or empty');
  }
  if (typeof it.verification_method !== 'string' || it.verification_method.length === 0) {
    problems.push('verification_method missing — every committed item must carry its verification provenance');
  }

  // W1.2/E10/D10: evidence_level is OPTIONAL structured provenance (distinct
  // from verification_method, which stays free-text answer-correctness
  // detail) — enum-checked when present, never required.
  if (it.evidence_level !== undefined) {
    if (typeof it.evidence_level !== 'string' || !EVIDENCE_LEVEL_SET.has(it.evidence_level)) {
      problems.push(
        `evidence_level '${String(it.evidence_level)}' is not one of {${EVIDENCE_LEVELS.join(', ')}}`,
      );
    }
  }

  const kind = it.question_type;
  if (typeof kind !== 'string' || !VALID_KINDS.has(kind)) {
    problems.push(`question_type must be one of mcq/msq/nat, got ${JSON.stringify(kind)}`);
    return problems; // nothing further can be checked without a valid kind
  }

  if (typeof it.marks !== 'number' || !(it.marks > 0)) {
    problems.push('marks missing or not a positive number');
  }

  const options = it.options;
  if (kind === 'mcq' || kind === 'msq') {
    if (!Array.isArray(options) || options.length === 0) {
      problems.push(`options missing or empty (required for ${kind})`);
    }
  }

  if (kind === 'mcq') {
    const idx = it.answer_index;
    if (typeof idx !== 'number') {
      problems.push('answer_index missing or not a number (required for mcq)');
    } else if (Array.isArray(options) && (idx < 0 || idx >= options.length)) {
      problems.push(`answer_index ${idx} is out of range for ${options.length} option(s)`);
    }
  }

  if (kind === 'msq') {
    const indices = it.answer_indices;
    if (!Array.isArray(indices) || indices.length === 0) {
      problems.push('answer_indices missing or empty (required for msq)');
    } else if (Array.isArray(options)) {
      for (const idx of indices) {
        if (typeof idx !== 'number' || idx < 0 || idx >= options.length) {
          problems.push(`answer_indices contains out-of-range index ${JSON.stringify(idx)} for ${options.length} option(s)`);
        }
      }
    }
  }

  if (kind === 'nat') {
    const range = it.answer_range;
    if (
      !Array.isArray(range) ||
      range.length !== 2 ||
      typeof range[0] !== 'number' ||
      typeof range[1] !== 'number'
    ) {
      problems.push('answer_range missing or not a [number, number] tuple (required for nat)');
    } else if (range[0] > range[1]) {
      problems.push(`answer_range is inverted: [${range[0]}, ${range[1]}]`);
    }
  }

  // also_tests is optional, but when present it must be a string array of
  // KNOWN concept ids — a typo here would silently under-report coverage
  // rather than fail loudly, so it is validated like every other field.
  if (it.also_tests !== undefined) {
    const also = it.also_tests;
    if (!Array.isArray(also) || also.some((c) => typeof c !== 'string')) {
      problems.push('also_tests, if present, must be an array of strings');
    } else {
      for (const conceptId of also) {
        if (!KNOWN_CONCEPT_IDS.has(conceptId)) {
          problems.push(`also_tests references unknown concept_id ${JSON.stringify(conceptId)}`);
        }
      }
      if (typeof it.concept_id === 'string' && also.includes(it.concept_id)) {
        problems.push(`also_tests should not repeat the item's own concept_id (${JSON.stringify(it.concept_id)})`);
      }
    }
  }

  return problems;
}

// ---------------------------------------------------------------------------
// Deterministic re-grade — grade the item against its OWN correct answer.
// ---------------------------------------------------------------------------

export interface RegradeResult {
  ok: boolean;
  reason?: string;
}

const scorer = new GateDeterministicScorer();

/** Requires the item to already be schema-valid — call after validateItemSchema returns []. */
export async function regradeOwnAnswer(item: AuthoredItem): Promise<RegradeResult> {
  const kind = item.question_type as GateItemKind;
  const gateItem: GateItem = {
    id: item.id,
    kind,
    marks: item.marks as number,
    answerIndex: item.answer_index,
    options: item.options,
    answerIndices: item.answer_indices,
    answerRange: item.answer_range,
  };

  let response: GateResponse;
  if (kind === 'mcq') {
    response = { kind, selectedIndex: item.answer_index };
  } else if (kind === 'msq') {
    response = { kind, selectedIndices: item.answer_indices };
  } else {
    // nat: re-grade the item's ACTUAL authored correct_answer value, not
    // merely the midpoint of the derived tolerance range — this is what
    // "grade its own correct answer" means literally.
    const parsed = item.correct_answer !== undefined ? parseNumericAnswer(item.correct_answer) : null;
    const [lo, hi] = item.answer_range ?? [NaN, NaN];
    const value = parsed ?? (lo + hi) / 2;
    response = { kind, value };
  }

  try {
    const result = await scorer.grade(gateItem, response);
    if (!result.casFinalAnswerCorrect) {
      return { ok: false, reason: 're-grading its own correct answer was marked INCORRECT' };
    }
    if (result.earned !== gateItem.marks) {
      return { ok: false, reason: `re-grading its own correct answer earned ${result.earned}/${gateItem.marks} marks, not full credit` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: `grader threw: ${(err as Error).message}` };
  }
}

// ---------------------------------------------------------------------------
// W1.2/E10 phrase rule — shared over both practice-items and PYQ-bank items.
// ---------------------------------------------------------------------------

/**
 * Checks one or more text fields on an item for forbidden unsourced-claim
 * phrases (src/content/evidence-phrase-rule.ts) and returns human-readable
 * problem strings — D8 precision: names the id, the field, the phrase found,
 * and the fix.
 */
export function checkPhraseRule(
  id: string,
  evidenceLevel: unknown,
  fields: Record<string, string | undefined | null>,
): string[] {
  const problems: string[] = [];
  if (evidenceLevelLicensesClaim(typeof evidenceLevel === 'string' ? evidenceLevel : undefined)) return problems;

  for (const [fieldName, text] of Object.entries(fields)) {
    const hits = findForbiddenPhrases(text);
    for (const hit of hits) {
      problems.push(
        `${id}: ${fieldName} contains "${hit.phrase}" without evidence_level='directly_reviewed' ` +
          `(actual: ${JSON.stringify(evidenceLevel ?? null)}) — either add directly_reviewed provenance ` +
          `for this specific claim or remove the phrase`,
      );
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------
// PYQ bank (frontend/public/data/pyq-bank.json) — W1.2/E10 schema addition.
// ---------------------------------------------------------------------------

export interface PyqBankProblem {
  id: string;
  question_text?: string;
  explanation?: string;
  /**
   * Optional — W1.2/E10/D10 structured provenance, the PYQ-bank mirror of
   * AuthoredItem.evidence_level (src/scoring/learning-object-catalog-file.ts).
   * D10, stated here as at that other definition: `evidence_level` is the
   * structured, enum-checked provenance field for an exam-relevance claim
   * ABOUT this problem (e.g. "this pattern is high-yield"); it is separate
   * from whether the ANSWER is correct, which this bank tracks via its own
   * `verified` boolean — the two are never rivals. One of
   * EVIDENCE_LEVELS; `directly_reviewed` is the only value that licenses
   * "high-yield" / "frequently asked" / "most repeated" / "often asked"
   * copy on this entry (src/content/evidence-phrase-rule.ts).
   */
  evidence_level?: string;
  [key: string]: unknown;
}

export interface PyqBankFile {
  version?: unknown;
  problems: PyqBankProblem[];
  [key: string]: unknown;
}

export function loadPyqBank(filePath: string = DEFAULT_PYQ_BANK_PATH): PyqBankFile {
  // Deliberately no try/catch — same discipline as loadAllPracticeItemBanks:
  // a bank nobody can read must fail the gate loudly, not count as empty.
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as { problems?: unknown };
  if (!Array.isArray(raw.problems)) {
    throw new Error(`${filePath}: no "problems" array (or it is not an array)`);
  }
  return raw as PyqBankFile;
}

/** Schema + phrase-rule violations across the PYQ bank. Empty array = clean. */
export function checkPyqBank(bank: PyqBankFile): string[] {
  const problems: string[] = [];
  for (let i = 0; i < bank.problems.length; i++) {
    const p = bank.problems[i];
    const id = typeof p?.id === 'string' && p.id.length > 0 ? p.id : `problems[${i}]`;

    if (p.evidence_level !== undefined) {
      if (typeof p.evidence_level !== 'string' || !EVIDENCE_LEVEL_SET.has(p.evidence_level)) {
        problems.push(`${id}: evidence_level '${String(p.evidence_level)}' is not one of {${EVIDENCE_LEVELS.join(', ')}}`);
      }
    }

    problems.push(
      ...checkPhraseRule(id, p.evidence_level, {
        question_text: p.question_text,
        explanation: p.explanation,
      }),
    );
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Full run over a directory — the pure core `main()` wraps for I/O + exit.
// ---------------------------------------------------------------------------

export interface CheckReport {
  bankCount: number;
  itemCount: number;
  problems: string[];
}

export async function checkAllPracticeItems(dir: string = DEFAULT_ITEMS_DIR): Promise<CheckReport> {
  const banks = loadAllPracticeItemBanks(dir); // throws loudly on a parse failure
  const problems: string[] = [];
  let itemCount = 0;

  for (const bank of banks) {
    for (let i = 0; i < bank.items.length; i++) {
      const raw = bank.items[i] as AuthoredItem & Record<string, unknown>;
      itemCount++;
      const id = (raw as { id?: unknown })?.id;
      const label = `${bank.file}[${i}]${typeof id === 'string' ? ` (${id})` : ''}`;

      const schemaProblems = validateItemSchema(raw);
      if (schemaProblems.length > 0) {
        problems.push(`${label}: ${schemaProblems.join('; ')}`);
        continue; // a malformed item cannot be safely re-graded
      }

      const regrade = await regradeOwnAnswer(raw as AuthoredItem);
      if (!regrade.ok) {
        problems.push(`${label}: ${regrade.reason}`);
      }

      problems.push(
        ...checkPhraseRule(typeof id === 'string' ? id : label, raw.evidence_level, {
          question_text: raw.question_text,
          solution_steps: Array.isArray(raw.solution_steps) ? raw.solution_steps.join(' ') : undefined,
        }),
      );
    }
  }

  return { bankCount: banks.length, itemCount, problems };
}

// ---------------------------------------------------------------------------
// CLI entry
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`\n[check-practice-items] Checking ${DEFAULT_ITEMS_DIR}\n`);

  let report: CheckReport;
  let pyqProblems: string[];
  let pyqCount = 0;
  try {
    report = await checkAllPracticeItems();
    const pyqBank = loadPyqBank();
    pyqCount = pyqBank.problems.length;
    pyqProblems = checkPyqBank(pyqBank);
  } catch (err) {
    console.error(`[check-practice-items] FATAL — a bank failed to parse: ${(err as Error).message}\n`);
    process.exit(1);
    return;
  }

  const allProblems = [...report.problems, ...pyqProblems];

  if (allProblems.length > 0) {
    console.error(
      `✗ ${allProblems.length} problem(s) across ${report.itemCount} practice item(s) in ` +
        `${report.bankCount} bank(s) + ${pyqCount} PYQ bank entr(y/ies):\n`,
    );
    for (const p of allProblems) console.error(`  - ${p}`);
    console.error('');
    process.exit(1);
    return;
  }

  console.log(
    `✓ ${report.itemCount} practice item(s) across ${report.bankCount} bank(s): ` +
    `schema-valid and self-re-grade to full marks.\n` +
    `✓ ${pyqCount} PYQ bank entr(y/ies): evidence_level schema-valid; phrase rule holds.\n`,
  );
  process.exit(0);
}

// Only run when invoked as a CLI — importing this module to test its pure
// functions must not execute main() and call process.exit().
if (process.argv[1]?.endsWith('check-practice-items.ts')) {
  main().catch((e) => {
    console.error('[check-practice-items] Fatal error:', e);
    process.exit(1);
  });
}
