/**
 * src/scenarios/policy-runner.ts
 *
 * Deterministic scripted-answer policy for the scenario runner. Given a
 * persona + an atom + the persona's current mastery state, returns the
 * answer the policy says to pick.
 *
 * Determinism is mandatory — the trial output is a regression artifact.
 * Every random draw uses a PRNG seeded by SHA-256(persona.id + ':' +
 * concept_id + ':' + atom_idx). No Math.random() anywhere.
 *
 * v1 supports two rule shapes:
 *   - first_exposure: pick a distractor of a given `kind` with prob p
 *   - default:        pick the correct answer with prob = mastery + 0.2
 *
 * The runner returns either:
 *   { kind: 'answer', answer: string, correct: boolean }
 *   { kind: 'needs_human', reason: string }   // for interactive atoms
 */

import { createHash } from 'crypto';
import type { Persona, AnswerPolicy } from './persona-loader';

export interface AtomShape {
  id: string;
  concept_id: string;
  atom_type: string;
  /** When present, the policy can pick by index. */
  options?: Array<{ id?: string; text?: string; is_correct?: boolean; distractor_kind?: string }>;
  /** Fenced ```interactive-spec block presence is signalled by the loader. */
  has_interactive_spec?: boolean;
}

export interface PolicyContext {
  persona: Persona;
  atom: AtomShape;
  /** 0-based index of this atom inside the trial. */
  atom_idx: number;
  /** Current mastery for atom.concept_id (0..1). */
  mastery: number;
  /** True if this is the persona's first exposure to this concept in the trial. */
  first_exposure: boolean;
}

export type PolicyResult =
  | { kind: 'answer'; answer_id: string; correct: boolean; via_rule: string }
  | { kind: 'needs_human'; reason: string };

// ----------------------------------------------------------------------------
// Deterministic PRNG: mulberry32 seeded from SHA-256(key).

export function seededRng(key: string): () => number {
  const hash = createHash('sha256').update(key).digest();
  let seed = hash.readUInt32LE(0);
  return function rng(): number {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ----------------------------------------------------------------------------

export function applyPolicy(ctx: PolicyContext): PolicyResult {
  if (ctx.atom.has_interactive_spec) {
    return {
      kind: 'needs_human',
      reason: `interactive atom (type=${ctx.atom.atom_type})`,
    };
  }

  const opts = ctx.atom.options ?? [];
  if (opts.length === 0) {
    // Free-text / numeric atoms: scripted v1 doesn't synthesize answers, so
    // we skip with a clear marker. This keeps the runner honest about what
    // the policy can and can't do.
    return {
      kind: 'needs_human',
      reason: `atom has no options (atom_type=${ctx.atom.atom_type})`,
    };
  }

  const rng = seededRng(`${ctx.persona.id}:${ctx.atom.concept_id}:${ctx.atom_idx}`);
  const policy: AnswerPolicy = ctx.persona.answer_policy;

  // First-exposure rule: try each rule with .on === 'first_exposure' if applicable.
  if (ctx.first_exposure) {
    for (const rule of policy.rules) {
      if (rule.on !== 'first_exposure') continue;
      if (rule.action !== 'pick_distractor_kind') continue;

      // Find a distractor option of the right kind.
      const distractor = opts.find(
        (o) => !o.is_correct && o.distractor_kind === rule.kind,
      );
      if (!distractor) continue;

      const draw = rng();
      if (draw < rule.probability) {
        return {
          kind: 'answer',
          answer_id: distractor.id ?? `idx-${opts.indexOf(distractor)}`,
          correct: false,
          via_rule: `first_exposure:${rule.kind}`,
        };
      }
    }
  }

  // Default rule: pick correct with probability = clamp(mastery + 0.2, 0, 1).
  const probCorrect = Math.max(0, Math.min(1, ctx.mastery + 0.2));
  const correctOpt = opts.find((o) => o.is_correct);
  const incorrectOpts = opts.filter((o) => !o.is_correct);

  const draw = rng();
  if (correctOpt && draw < probCorrect) {
    return {
      kind: 'answer',
      answer_id: correctOpt.id ?? `idx-${opts.indexOf(correctOpt)}`,
      correct: true,
      via_rule: 'default:pick_correct',
    };
  }

  // Otherwise pick a deterministic incorrect option (first available).
  const fallback = incorrectOpts[0] ?? opts[0];
  return {
    kind: 'answer',
    answer_id: fallback?.id ?? 'idx-0',
    correct: !!fallback?.is_correct,
    via_rule: 'default:pick_incorrect',
  };
}
