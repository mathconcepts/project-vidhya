import type { ErrorTag } from '../core/interfaces';

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
 *   - msq (Wave 11): needs ≥2 distinct correct answers AND ≥1 distractor
 *     disjoint from them (a "select all" where everything is correct
 *     teaches nothing and grades trivially). Same shuffle-once rule;
 *     answer_indices point into the stored canonical order.
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
 *
 * ── W3.4/E2 — failure-tagged distractors (mcq only): the caller may supply
 * `distractorFailureTags`, a map from a distractor's TRIMMED text to an
 * `ErrorTag` naming the misconception that distractor is built to catch.
 * Shuffle happens ONCE, here (see the header note above) — tags are
 * resolved against the POST-shuffle `options` array, keyed by the option's
 * final index, never the pre-shuffle position. The correct answer's index
 * NEVER receives a tag even if the caller's map happens to key it (E2 leak
 * discipline: the one option WITHOUT a tag would otherwise reveal the
 * answer, so "correct is always untagged" must hold unconditionally, not
 * just by the caller's good behavior). Server-only data — see the leak
 * tests on GET /api/practice/item/:id and mock-exam-routes.ts's
 * renderSafeQuestion; never served pre-answer.
 */

export interface DerivedMarking {
  question_type: 'mcq' | 'msq' | 'nat';
  marks: number;
  options?: string[];
  answer_index?: number;
  answer_indices?: number[];
  answer_range?: [number, number];
  /**
   * mcq only, optional. POST-shuffle option index → failure-hypothesis
   * tag for that distractor. Absent when the caller supplied no
   * `distractorFailureTags`, or when none of them matched a surviving
   * distractor. Never contains the correct answer's index.
   */
  distractor_failure_tags?: Partial<Record<number, ErrorTag>>;
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
  format: string;                    // ProblemRequest['format']: 'mcq' | 'msq' | 'numerical' | 'open'
  correctAnswer: string;
  /** msq only: the full set of correct answers (correctAnswer is ignored for msq). */
  correctAnswers?: string[];
  distractors: string[];
  difficulty: number;
  rng?: () => number;
  /**
   * mcq only, optional (W3.4/E2). Map from a distractor's trimmed text to
   * the failure hypothesis it's built to catch. See DerivedMarking's own
   * doc comment for the shuffle/leak discipline this resolves against.
   */
  distractorFailureTags?: Record<string, ErrorTag>;
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
    const answer_index = options.indexOf(correct);

    // Resolve failure tags against the POST-shuffle indices (shuffle-integrity
    // — see the file header). The correct answer's index is unconditionally
    // excluded, never merely by trusting the caller's map didn't key it.
    let distractor_failure_tags: Partial<Record<number, ErrorTag>> | undefined;
    if (args.distractorFailureTags) {
      const tags: Partial<Record<number, ErrorTag>> = {};
      options.forEach((opt, i) => {
        if (i === answer_index) return;
        const tag = args.distractorFailureTags![opt];
        if (tag) tags[i] = tag;
      });
      if (Object.keys(tags).length > 0) distractor_failure_tags = tags;
    }

    return {
      question_type: 'mcq',
      marks,
      options,
      answer_index,
      ...(distractor_failure_tags ? { distractor_failure_tags } : {}),
    };
  }

  if (format === 'msq') {
    const correct = [...new Set((args.correctAnswers ?? []).map(c => c?.trim()).filter(Boolean))];
    if (correct.length < 2) return null;   // <2 correct is an mcq, not an msq — refuse mislabeled marking
    const correctSet = new Set(correct);
    const distractors = [...new Set((args.distractors ?? []).map(d => d?.trim()).filter(Boolean))]
      .filter(d => !correctSet.has(d));
    if (distractors.length < 1) return null;   // all-correct "select all" grades trivially
    const options = shuffle([...correct, ...distractors], args.rng);
    return {
      question_type: 'msq',
      marks,
      options,
      answer_indices: options
        .map((opt, i) => (correctSet.has(opt) ? i : -1))
        .filter(i => i >= 0),
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
