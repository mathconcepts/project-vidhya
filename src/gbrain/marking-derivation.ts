/**
 * src/gbrain/marking-derivation.ts — Wave 10: derive the migration
 * 032/033 marking columns for a freshly generated problem, honestly.
 *
 * The generator is the item's AUTHOR, so assigning marks and fixing a
 * canonical option order here is legitimate authorship — unlike guessing
 * marking for pre-existing rows, which stays forbidden (blueprint D4/D8).
 * What this module still refuses to do is fabricate an answer KEY it
 * can't stand behind:
 *
 *   - mcq: needs the LLM's correct_answer AND ≥2 distinct distractors.
 *     Options = shuffle([correct, ...distractors]) ONCE, here; the
 *     shuffled order is the canonical order stored in `options`, and
 *     `answer_index` points into it. (Shuffling at serve time would
 *     silently corrupt the key — see migration 033's header.)
 *   - nat: needs a correct_answer that parses as a plain finite number
 *     (or a simple a/b fraction). Symbolic answers (π/4, √2, "x=3") are
 *     NOT nat-gradable and get no marking — the row still serves as
 *     display-only practice.
 *   - anything else (format 'open', unparseable answers): no marking.
 *
 * Marks policy (documented, deliberate): GATE items are 1 or 2 marks;
 * we author hard items (difficulty ≥ 0.66, the generator's own "hard"
 * label boundary) as 2-mark, the rest as 1-mark.
 *
 * NAT tolerance policy: GATE NAT keys are published as accepted ranges
 * (typically to two decimals). We author the range as value ± max(0.01,
 * 0.5% · |value|) — wide enough for two-decimal entry of the exact
 * value, tight enough to reject a genuinely different answer.
 */

export interface DerivedMarking {
  question_type: 'mcq' | 'nat';
  marks: number;
  options?: string[];
  answer_index?: number;
  answer_range?: [number, number];
}

/** Difficulty boundary above which the generator authors 2-mark items. */
export const TWO_MARK_DIFFICULTY = 0.66;

/** NAT authored tolerance: max(NAT_ABS_TOL, NAT_REL_TOL · |value|). */
export const NAT_ABS_TOL = 0.01;
export const NAT_REL_TOL = 0.005;

export function marksForDifficulty(difficulty: number): number {
  return difficulty >= TWO_MARK_DIFFICULTY ? 2 : 1;
}

/**
 * Strict numeric parse: plain decimal/integer (optional sign, optional
 * exponent) or a simple a/b fraction. Returns null for anything else —
 * including strings with units, LaTeX, or trailing text.
 */
export function parseNumericAnswer(raw: string): number | null {
  const s = raw.trim().replace(/^\$+|\$+$/g, '').trim();
  if (/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) {
    const v = Number(s);
    return Number.isFinite(v) ? v : null;
  }
  const frac = s.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);
  if (frac) {
    const denom = Number(frac[2]);
    if (denom === 0) return null;
    const v = Number(frac[1]) / denom;
    return Number.isFinite(v) ? v : null;
  }
  return null;
}

/** Fisher–Yates; injectable rng for deterministic tests. */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Derive marking for a freshly generated problem, or null when the
 * material can't honestly back a deterministic key.
 */
export function deriveMarking(args: {
  format: string;                    // ProblemRequest['format']: 'mcq' | 'numerical' | 'open'
  correctAnswer: string;
  distractors: string[];
  difficulty: number;
  rng?: () => number;
}): DerivedMarking | null {
  const { format, correctAnswer, difficulty } = args;
  const marks = marksForDifficulty(difficulty);

  if (format === 'mcq') {
    const correct = correctAnswer?.trim();
    if (!correct) return null;
    // Distinct, non-empty, and not accidentally equal to the correct answer.
    const distractors = [...new Set((args.distractors ?? []).map(d => d?.trim()).filter(Boolean))]
      .filter(d => d !== correct);
    if (distractors.length < 2) return null;   // a 2-option "MCQ" is a coin flip, refuse
    const options = shuffle([correct, ...distractors], args.rng);
    return {
      question_type: 'mcq',
      marks,
      options,
      answer_index: options.indexOf(correct),
    };
  }

  if (format === 'numerical') {
    const v = parseNumericAnswer(correctAnswer ?? '');
    if (v === null) return null;
    const tol = Math.max(NAT_ABS_TOL, NAT_REL_TOL * Math.abs(v));
    return {
      question_type: 'nat',
      marks,
      answer_range: [v - tol, v + tol],
    };
  }

  return null;   // 'open' and anything unknown: not deterministically gradable
}
