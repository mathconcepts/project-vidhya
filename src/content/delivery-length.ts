/**
 * src/content/delivery-length.ts
 *
 * docs/designs/2026-09-02-content-strategy-research-integration-plan.md
 * (P5, follow-up named in TODOS.md): the research framework calls for three
 * delivery lengths compiled from the SAME base anchors per topic — Micro
 * (hook, minimum formal rule, one example, one trap, one recall, one mode
 * check), Standard (the full sequence), Deep (Standard plus more).
 *
 * `SessionMode.micro_sprint` (src/content/content-types.ts) already exists
 * and already forces STATIC modality (src/content/modality-orchestrator.ts)
 * for speed, but nothing shortened the ATOM SET itself — a "micro sprint"
 * session still received all 11 authored atom types. This module is that
 * missing half: a pure filter over an already-loaded ContentAtom[].
 *
 * Scoped honestly:
 *   - 'micro' is real: a strict subset of atom types, preserving order.
 *   - 'standard' is a no-op: it IS today's existing default. Every atom
 *     Vidhya authors already fits the research's "Standard" contract.
 *   - 'deep' is ALSO currently a no-op. The research's Deep tier wants
 *     "multiple representations, varied transfer, extended assessment
 *     practice" beyond Standard — Vidhya does not yet author a
 *     systematically separate deep layer per concept (a few concepts have a
 *     genuine second worked_example; most don't), so pretending 'deep'
 *     does more than 'standard' today would be exactly the fabricated
 *     precision this codebase's other gates (evidence_level, delta-kinds)
 *     go out of their way to refuse. When a real deep layer exists, this is
 *     the seam that composes it in — see the module-level TODO marker below.
 *
 * Resonance-beat safety (the risk TODOS.md names for this whole feature):
 * a fused hook/intuition scene (§ CLAUDE.md "Resonance beats") must never be
 * silently dropped by a length filter just because its atom_type isn't in
 * the micro set. `carriesInteractiveScene` is a cheap SYNCHRONOUS substring
 * check (this module must stay sync — selectAtoms() in pedagogy-engine.ts,
 * this module's caller, is documented pure/no-I/O) for the fenced block the
 * renderer's own InteractiveSidecar/resonance pipeline looks for; any atom
 * carrying one is kept regardless of the length tier's atom-type list.
 */

import type { AtomType, ContentAtom } from './content-types';

export type DeliveryLength = 'micro' | 'standard' | 'deep';

export const DELIVERY_LENGTHS: readonly DeliveryLength[] = ['micro', 'standard', 'deep'];

/**
 * The research's Micro contract: "hook, minimum formal rule, one example,
 * one trap, one recall and one mode check." Mapped onto Vidhya's 11 atom
 * types (src/content/content-types.ts's AtomType docblock):
 *   hook               -> hook
 *   minimum formal rule -> formal_definition
 *   one example        -> worked_example
 *   one trap           -> common_traps
 *   one recall         -> retrieval_prompt
 *   one mode check     -> exam_pattern
 * Dropped for Micro: intuition, visual_analogy, micro_exercise, mnemonic,
 * interleaved_drill — "Extended intuition and secondary examples" per the
 * research's own compression column.
 */
export const MICRO_ATOM_TYPES: ReadonlySet<AtomType> = new Set<AtomType>([
  'hook', 'formal_definition', 'worked_example', 'common_traps', 'retrieval_prompt', 'exam_pattern',
]);

/**
 * Cheap, synchronous, conservative: true only when the atom body contains
 * the exact fenced marker the renderer's real parsers key off (see
 * src/content/interactive-spec-loader.ts and gif-generator.ts's
 * `` ```gif-scene`` `` for the two shapes an authored body can carry). A
 * false positive just means an atom that didn't strictly need protecting
 * gets kept anyway — safe. A false negative would mean silently dropping a
 * real scene, which is exactly what this function exists to prevent, so it
 * errs toward matching.
 */
export function carriesInteractiveScene(content: string): boolean {
  return content.includes('```interactive-spec') || content.includes('```gif-scene');
}

/**
 * Filter `atoms` to the given delivery length. Preserves input order —
 * ordering (mastery-tier sequencing, exam-countdown reordering, error-streak
 * head injection) is pedagogy-engine.ts's job, applied before or after this
 * filter depending on call order; this function only decides IN or OUT.
 *
 * 'standard' and 'deep' both return `atoms` unchanged (see module doc for
 * why 'deep' is not yet distinct). 'micro' returns the MICRO_ATOM_TYPES
 * subset, plus any atom NOT in that set that still carries a real
 * interactive/resonance scene (protects the fused hook/intuition contract
 * when the scene happens to live on `intuition` rather than `hook`).
 */
export function selectAtomsForDeliveryLength(
  atoms: ContentAtom[],
  length: DeliveryLength,
): ContentAtom[] {
  if (length !== 'micro') return atoms;
  return atoms.filter(
    (a) => MICRO_ATOM_TYPES.has(a.atom_type) || carriesInteractiveScene(a.content),
  );
}

/**
 * Bridges the existing SessionMode axis to a delivery length when the
 * caller didn't ask for one explicitly. Only 'micro_sprint' maps to
 * anything other than 'standard' — 'knowledge' / 'exam-prep' / 'revision'
 * are cadence choices, not a request for a shorter lesson.
 */
export function deliveryLengthFromSessionMode(sessionMode: string | undefined): DeliveryLength {
  return sessionMode === 'micro_sprint' ? 'micro' : 'standard';
}

export function isDeliveryLength(value: unknown): value is DeliveryLength {
  return typeof value === 'string' && (DELIVERY_LENGTHS as readonly string[]).includes(value);
}
