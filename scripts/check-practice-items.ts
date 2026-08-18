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
 * Usage: npx tsx scripts/check-practice-items.ts
 * Exit: 0 = every item schema-valid + self-re-grades to full marks.
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
import type { AuthoredItem } from '../src/scoring/learning-object-catalog-file';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_ITEMS_DIR = path.join(ROOT, 'data', 'practice-items');

const VALID_KINDS = new Set(['mcq', 'msq', 'nat']);

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
      const raw = bank.items[i];
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
  try {
    report = await checkAllPracticeItems();
  } catch (err) {
    console.error(`[check-practice-items] FATAL — a bank failed to parse: ${(err as Error).message}\n`);
    process.exit(1);
    return;
  }

  if (report.problems.length > 0) {
    console.error(`✗ ${report.problems.length} problem(s) across ${report.itemCount} item(s) in ${report.bankCount} bank(s):\n`);
    for (const p of report.problems) console.error(`  - ${p}`);
    console.error('');
    process.exit(1);
    return;
  }

  console.log(
    `✓ ${report.itemCount} practice item(s) across ${report.bankCount} bank(s): ` +
    `schema-valid and self-re-grade to full marks.\n`,
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
