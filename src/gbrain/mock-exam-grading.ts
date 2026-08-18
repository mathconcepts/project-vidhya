/**
 * src/gbrain/mock-exam-grading.ts — T22 (ENG-D3): pure grading + normalization
 * logic for the mock exam. Split out from moat-operations.ts's DB-heavy
 * `generateMockExam` so this half — the half that decides who got what
 * marks — is unit-testable without Postgres.
 *
 * `generateMockExam` pulls from TWO heterogeneous sources with different
 * shapes:
 *   - `pyq_questions`: letter-keyed `options` ({A: "...", B: "..."}) +
 *     a single `correct_answer` letter + its own `marks` column.
 *   - `generated_problems`: migration 032/033's canonical INDEX-ordered
 *     `options` array + `answer_index`/`answer_indices`/`answer_range` +
 *     `question_type`/`marks` — or none of that, for rows generated before
 *     those columns existed.
 *
 * Both normalize into the SAME `GateItem` shape `deterministic-scorer.ts`
 * already grades (mcq/msq/nat). A row that can't normalize (missing marks,
 * missing options, missing answer key) is NOT guessed — it's excluded from
 * grading and counted as `ungraded`, exactly the deterministic-scorer
 * refusal discipline the rest of the practice path already follows.
 */

import type { GateItem, GateItemKind, GateResponse } from '../scoring/deterministic-scorer';
import { makeDeterministicScorer } from '../scoring/deterministic-scorer';

export interface MockExamQuestionRow {
  id: string;
  topic: string;
  source: 'pyq' | 'generated';
  /** pyq: {A: "...", ...}; generated (post-033): a JSON-encoded ordered array. Either may be a string or already-parsed. */
  options?: unknown;
  /** pyq: a letter ('A'..); generated (pre-033, unmarked): a raw string, unusable for grading. */
  correct_answer?: unknown;
  marks?: unknown;
  question_type?: unknown;
  answer_index?: unknown;
  answer_indices?: unknown;
  answer_range?: unknown;
}

export interface NormalizedMockQuestion {
  id: string;
  topic: string;
  /** null = not deterministically gradable — excluded from the marks total, never guessed. */
  item: GateItem | null;
}

const GATE_KINDS = new Set<GateItemKind>(['mcq', 'msq', 'nat']);

function parseMaybeJson(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return v; }
}

/**
 * pyq_questions: letter-keyed options ({A,B,C,D}) + a correct_answer
 * letter. Canonicalizes to an INDEX-ordered options array (sorted by key)
 * so it grades through the exact same GateDeterministicScorer path as
 * every other mcq — no separate letter-based grading logic to drift.
 */
export function normalizePyqRow(row: MockExamQuestionRow): NormalizedMockQuestion {
  const rawOptions = parseMaybeJson(row.options);
  const marks = typeof row.marks === 'number' && row.marks > 0 ? row.marks : 1;

  if (!rawOptions || typeof rawOptions !== 'object' || Array.isArray(rawOptions)) {
    return { id: row.id, topic: row.topic, item: null };
  }
  const entries = Object.entries(rawOptions as Record<string, unknown>)
    .filter(([, v]) => typeof v === 'string')
    .sort(([a], [b]) => a.localeCompare(b));
  if (entries.length < 2) return { id: row.id, topic: row.topic, item: null };

  const options = entries.map(([, v]) => v as string);
  const correctLetter = typeof row.correct_answer === 'string' ? row.correct_answer.trim().toUpperCase() : null;
  const answerIndex = correctLetter ? entries.findIndex(([k]) => k.trim().toUpperCase() === correctLetter) : -1;
  if (answerIndex < 0) return { id: row.id, topic: row.topic, item: null };

  return {
    id: row.id, topic: row.topic,
    item: { id: row.id, kind: 'mcq', marks, options, answerIndex },
  };
}

/**
 * generated_problems: already canonical (migration 032/033 shape) when
 * present. Reuses the SAME field names practice-routes.ts's
 * `gateItemFromPayload` validates — kept as an independent implementation
 * here (not a shared import) because the row shape differs (snake_case
 * SQL columns vs. the catalog's camelCase payload); the grading RULES
 * still come from the one shared `GateDeterministicScorer`.
 */
export function normalizeGeneratedRow(row: MockExamQuestionRow): NormalizedMockQuestion {
  const kind = row.question_type;
  const marks = row.marks;
  if (kind !== 'mcq' && kind !== 'msq' && kind !== 'nat' || typeof marks !== 'number' || !(marks > 0)) {
    return { id: row.id, topic: row.topic, item: null };
  }
  const item: GateItem = { id: row.id, kind: kind as GateItemKind, marks };

  if (kind === 'mcq' || kind === 'msq') {
    const options = parseMaybeJson(row.options);
    if (!Array.isArray(options) || options.length === 0) return { id: row.id, topic: row.topic, item: null };
    item.options = options;
  }
  if (kind === 'mcq') {
    const idx = row.answer_index;
    if (typeof idx !== 'number' || idx < 0 || idx >= (item.options as unknown[]).length) {
      return { id: row.id, topic: row.topic, item: null };
    }
    item.answerIndex = idx;
  }
  if (kind === 'msq') {
    const idx = parseMaybeJson(row.answer_indices);
    const n = (item.options as unknown[]).length;
    if (!Array.isArray(idx) || idx.length === 0 || !idx.every((i) => typeof i === 'number' && i >= 0 && i < n)) {
      return { id: row.id, topic: row.topic, item: null };
    }
    item.answerIndices = idx as number[];
  }
  if (kind === 'nat') {
    const r = parseMaybeJson(row.answer_range);
    if (!Array.isArray(r) || r.length !== 2 || !r.every((x) => typeof x === 'number')) {
      return { id: row.id, topic: row.topic, item: null };
    }
    item.answerRange = r as [number, number];
  }
  return { id: row.id, topic: row.topic, item };
}

export function normalizeMockExamRow(row: MockExamQuestionRow): NormalizedMockQuestion {
  return row.source === 'pyq' ? normalizePyqRow(row) : normalizeGeneratedRow(row);
}

// ────────────────────────────────────────────────────────────────────
// Grading
// ────────────────────────────────────────────────────────────────────

export interface MockExamTopicStat { correct: number; attempted: number; marks: number }
export interface MockExamGradeResult {
  earned: number;
  max: number;
  correct: number;
  wrong: number;
  skipped: number;
  ungraded: number;
  by_topic: Record<string, MockExamTopicStat>;
}

/** A response is either an mcq option index, an msq index array, a nat value, or absent (→ skipped). */
export type MockExamResponse = { selectedIndex?: number; selectedIndices?: number[]; value?: number } | undefined;

function responseToGateResponse(item: GateItem, raw: MockExamResponse): GateResponse {
  if (!raw) return { kind: item.kind, skipped: true };
  if (item.kind === 'mcq' && typeof raw.selectedIndex === 'number') return { kind: 'mcq', selectedIndex: raw.selectedIndex };
  if (item.kind === 'msq' && Array.isArray(raw.selectedIndices) && raw.selectedIndices.length > 0) {
    return { kind: 'msq', selectedIndices: raw.selectedIndices };
  }
  if (item.kind === 'nat' && typeof raw.value === 'number' && Number.isFinite(raw.value)) {
    return { kind: 'nat', value: raw.value };
  }
  return { kind: item.kind, skipped: true };
}

/**
 * Grades every normalized question against its response. Never throws on a
 * malformed response — an unusable response is treated as skipped, same as
 * a genuinely absent one. Ungraded questions (item === null) are excluded
 * from `earned`/`max` entirely and counted separately — never guessed,
 * never silently zeroed into the total as if they were attempted-and-wrong.
 */
export async function gradeMockExam(
  questions: ReadonlyArray<NormalizedMockQuestion>,
  responses: Record<string, MockExamResponse>,
): Promise<MockExamGradeResult> {
  const scorer = makeDeterministicScorer();
  let earned = 0, max = 0, correct = 0, wrong = 0, skipped = 0, ungraded = 0;
  const byTopic: Record<string, MockExamTopicStat> = {};

  for (const q of questions) {
    byTopic[q.topic] = byTopic[q.topic] ?? { correct: 0, attempted: 0, marks: 0 };
    if (!q.item) { ungraded++; continue; }

    const gateResponse = responseToGateResponse(q.item, responses[q.id]);
    if (gateResponse.skipped) { skipped++; continue; }

    const grade = await scorer.grade(q.item, gateResponse);
    max += grade.max;
    earned += grade.earned;
    byTopic[q.topic].attempted++;
    byTopic[q.topic].marks += grade.earned;
    if (grade.casFinalAnswerCorrect) { correct++; byTopic[q.topic].correct++; } else { wrong++; }
  }

  return { earned, max, correct, wrong, skipped, ungraded, by_topic: byTopic };
}
