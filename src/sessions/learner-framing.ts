/**
 * Learner framing — the persona axis for generated explanations.
 *
 * Why this exists: the thinking-gap service used to build its prompt from
 * (concept, question, expected answer, student answer) and nothing else. It
 * accepted a `top_misconceptions` array, hashed it into the cache key, and
 * then DROPPED IT before generating — the prompt never saw it. So every
 * student who made the same class of error on the same concept received a
 * byte-identical sentence, forever, from a cache written once. LLM-generated
 * at the origin, but static in every way a student could perceive.
 *
 * That is the "confident vs unconfident student" gap: nothing in the pipeline
 * ever knew which one it was talking to.
 *
 * This module derives a small, coarse framing from the student model and
 * makes it part of both the prompt and the cache key. Coarse is deliberate:
 *
 *   - Per-student caching would collapse the hit rate to ~0 and blow the
 *     runtime LLM budget (the <₹10/student/month ladder in the roadmap).
 *   - A 3 × 3 × 3 framing space keeps the cache cohort-shaped: at most 27
 *     variants per (concept, error_type), each shared by everyone who is in
 *     the same place emotionally and cognitively.
 *
 * It is also a deliberately NON-surveilling signal. Framing is derived on
 * demand, never persisted against a student, and the stored artefact is a
 * cohort label like `building/shaken/geometric` — it identifies a situation,
 * not a person.
 */

/** How much of this concept the student has actually got. */
export type MasteryBand = 'cold' | 'building' | 'solid';

/**
 * How the student is holding up. Named for the student's state, not for a
 * judgement about them — a "shaken" student is having a bad ten minutes,
 * which is a fact about the session, not a trait.
 */
export type LearnerStance = 'shaken' | 'steady' | 'assured';

/** Which representation lands for this student. Mirrors StudentModel. */
export type RepresentationMode = 'geometric' | 'algebraic' | 'balanced';

export interface LearnerFraming {
  band: MasteryBand;
  stance: LearnerStance;
  mode: RepresentationMode;
}

/** Shape we need off StudentModel. Structural so tests need no DB. */
export interface FramingInput {
  mastery_vector?: Record<string, { score?: number }> | null;
  motivation_state?: string | null;
  consecutive_failures?: number | null;
  representation_mode?: string | null;
}

export const DEFAULT_FRAMING: LearnerFraming = {
  band: 'cold',
  stance: 'steady',
  mode: 'balanced',
};

/**
 * Mastery thresholds. Kept as named constants because they are the boundary
 * between "explain from scratch" and "you know this, here's the slip" — the
 * single most audible difference between the variants.
 */
export const BUILDING_AT = 0.35;
export const SOLID_AT = 0.7;

/** Failures in a row that turn a steady student shaken, absent other signal. */
export const SHAKEN_AFTER_FAILURES = 3;

export function bandFor(mastery: number): MasteryBand {
  if (mastery >= SOLID_AT) return 'solid';
  if (mastery >= BUILDING_AT) return 'building';
  return 'cold';
}

export function deriveFraming(
  model: FramingInput | null | undefined,
  conceptId: string,
): LearnerFraming {
  if (!model) return DEFAULT_FRAMING;

  const entry = model.mastery_vector?.[conceptId];
  const mastery = typeof entry?.score === 'number' ? entry.score : 0;
  const band = bandFor(mastery);

  // Motivation is the stronger signal when present; the failure streak is the
  // fallback for cold-start sessions where motivation is still 'steady'.
  const motivation = (model.motivation_state ?? '').toLowerCase();
  const failures = model.consecutive_failures ?? 0;
  let stance: LearnerStance;
  if (motivation === 'frustrated' || motivation === 'flagging' || failures >= SHAKEN_AFTER_FAILURES) {
    stance = 'shaken';
  } else if (motivation === 'confident' || motivation === 'driven' || (band === 'solid' && failures === 0)) {
    stance = 'assured';
  } else {
    stance = 'steady';
  }

  const rawMode = (model.representation_mode ?? '').toLowerCase();
  const mode: RepresentationMode =
    rawMode === 'geometric' || rawMode === 'algebraic' ? rawMode : 'balanced';

  return { band, stance, mode };
}

/**
 * Stable, human-readable cache key component. Readable on purpose: an operator
 * looking at thinking_gap_cache should be able to see WHICH cohort a row
 * serves without decoding a hash.
 */
export function framingSignature(f: LearnerFraming): string {
  return `${f.band}/${f.stance}/${f.mode}`;
}

/** Every signature the system can emit. Used by the admin coverage report. */
export function allFramingSignatures(): string[] {
  const out: string[] = [];
  for (const band of ['cold', 'building', 'solid'] as MasteryBand[]) {
    for (const stance of ['shaken', 'steady', 'assured'] as LearnerStance[]) {
      for (const mode of ['geometric', 'algebraic', 'balanced'] as RepresentationMode[]) {
        out.push(framingSignature({ band, stance, mode }));
      }
    }
  }
  return out;
}

/**
 * The part of the prompt that actually makes a confident student's
 * explanation read differently from an unconfident one.
 *
 * Written as instructions about REGISTER and STARTING POINT, not as
 * flattery or commiseration. A shaken student is not told "don't worry" —
 * they are given a smaller first step, which is the thing that actually
 * helps. An assured student is not congratulated — they are given the
 * sharper, faster form, because padding wastes their time.
 */
export function framingInstructions(f: LearnerFraming): string {
  const band: Record<MasteryBand, string> = {
    cold:
      'They are new to this concept. Do not assume the underlying vocabulary. ' +
      'Name the one idea they are missing in plain words before anything else.',
    building:
      'They have partial command of this concept. Connect the mistake to the ' +
      'part they already have right, rather than re-teaching from zero.',
    solid:
      'They know this concept well, so treat the error as a slip in execution ' +
      'rather than a gap in understanding, unless the answer shows otherwise.',
  };

  const stance: Record<LearnerStance, string> = {
    shaken:
      'They have got several wrong in a row and are close to giving up. Keep it ' +
      'to one concrete, immediately doable correction. No pep talk, no praise, ' +
      'no mention of how they are feeling — a small win is what steadies them.',
    steady:
      'They are working steadily. Direct and matter-of-fact is right.',
    assured:
      'They are moving fast and getting most things right. Be terse and precise; ' +
      'skip the scaffolding and name the distinction that actually bit them.',
  };

  const mode: Record<RepresentationMode, string> = {
    geometric:
      'This student reasons visually — reach for shape, direction, and picture ' +
      'over symbol manipulation.',
    algebraic:
      'This student reasons symbolically — reach for the algebraic step or the ' +
      'formula condition over a picture.',
    balanced: '',
  };

  return [band[f.band], stance[f.stance], mode[f.mode]].filter(Boolean).join(' ');
}
