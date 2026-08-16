/**
 * The stance cadence — universal rules, stated once.
 *
 * Per-topic voice lives in `templates/<topic>.yaml` under each atom type's
 * `stances:` block, because what makes a good gentler explanation of a matrix
 * is not what makes a good gentler explanation of a convergence criterion.
 *
 * The rules below are NOT topic-specific, and repeating them in eleven YAML
 * files would guarantee they drift — this repo has already paid for that
 * lesson twice, once with model ids and once with the motivation vocabulary.
 * They live here, and the generator composes them with the topic's own
 * guidance.
 *
 * ── Each rule is enforced somewhere ─────────────────────────────────────
 *
 * A written instruction a model may or may not follow is a hope. Every rule
 * here has a check in `scripts/check-variant-agreement.ts` that fails the
 * build when it is ignored, and `stance-cadence.test.ts` asserts the two stay
 * in agreement. If you add a rule, add its check.
 */

import { ASSURED_PROSE_BUDGET } from '../../scripts/check-variant-agreement';

/**
 * Why `shaken` is capped against its own base rather than an absolute number.
 *
 * The reader is never told they are on a gentler path — decision 8A, and it is
 * the right call, because being told you have been given the easy version is
 * the labelling that makes someone feel handled. But it means the only signal
 * they CAN perceive is how much there is on the screen, and more of it reads
 * as harder. A gentler variant that is longer than the one that already
 * defeated them communicates the opposite of what it intends.
 *
 * Measured before this rule existed: authored variants ran 2.0x to 4.6x their
 * base atom's prose, and the confident-stance ones inflated just as much as
 * the struggling ones. Writing supportively had quietly become writing more.
 */
export const SHAKEN_CADENCE = `
Write SHORTER than the base atom. This is a hard limit, not a preference: the
student is never told they were given a gentler version, so length is the only
signal they can read, and more of it reads as harder.

The support does not disappear, it moves. Put every explanation that no longer
fits into the guided_walkthrough's prompts and hints, where it unfolds one step
at a time when the student asks for it. Prefer splitting one walkthrough step
into two over explaining a step at length on the page. If the base atom has no
walkthrough, you may add one; you may not add any other kind of interactive.

Concrete before general. Numbers before symbols. Make the check explicit and
show it being run.

No praise, no reassurance, and no mention of how the reader might be feeling.
A small win steadies someone. Being told they are struggling does not.

Vary the opening move. Do not reuse a construction that opens another concept's
variant in this topic — a phrase that recurs across concepts stops reading as
teaching and starts reading as a template.
`.trim();

export const ASSURED_CADENCE = `
Terse. Assume the mechanics are already there, and spend the space on the
distinction that actually costs marks: where two neighbouring ideas are not
interchangeable, or where a condition is necessary and nowhere near sufficient.

Prefer a counterexample to a restatement. Do not re-derive what the base atom
derives. Do not add scaffolding — a walkthrough this reader does not need is
padding wearing a helpful face.

Vary the opening move, as above.
`.trim();

/** Atom types that carry a stance variant. Mirrors NARRATIVE_ATOM_TYPES. */
export const CADENCE_ATOM_TYPES = ['hook', 'intuition', 'worked_example'] as const;

export type CadenceStance = 'shaken' | 'assured';

export function cadenceFor(stance: CadenceStance): string {
  return stance === 'shaken' ? SHAKEN_CADENCE : ASSURED_CADENCE;
}

/**
 * The full instruction for one (atom type, stance): universal cadence, then
 * the topic's own voice, then the hard budget the gate will enforce.
 *
 * The budget is stated numerically rather than left implicit. A model told
 * "be concise" and a model told "at most 130 prose words, and the build fails
 * above that" behave differently.
 */
export function buildStanceInstruction(input: {
  stance: CadenceStance;
  atomType: string;
  topicGuidance?: string;
  baseProseWords?: number;
}): string {
  const parts = [cadenceFor(input.stance)];
  if (input.topicGuidance?.trim()) {
    parts.push(`For this topic specifically:\n${input.topicGuidance.trim()}`);
  }
  if (input.stance === 'shaken' && typeof input.baseProseWords === 'number') {
    parts.push(
      `Hard limit: at most ${input.baseProseWords} prose words, counted with LaTeX and fenced blocks removed. The base atom is ${input.baseProseWords}; you must not exceed it.`,
    );
  }
  if (input.stance === 'assured') {
    const cap = ASSURED_PROSE_BUDGET[input.atomType];
    if (typeof cap === 'number') {
      parts.push(
        `Hard limit: at most ${cap} prose words, counted with LaTeX and fenced blocks removed.`,
      );
    }
  }
  return parts.join('\n\n');
}
