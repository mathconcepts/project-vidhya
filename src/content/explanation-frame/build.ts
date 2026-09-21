/**
 * buildFrameForConcept — assemble an ExplanationFrame from what is already
 * authored on disk.
 *
 * Nothing here generates text. Every slot is filled from an existing,
 * already-gated artifact:
 *
 *   anchor          <- the concept-anchor registry (ci:concept-anchors)
 *   core_idea       <- the concept's `intuition` atom, else `hook`
 *   worked_example  <- the `worked_example` atom
 *   trap            <- the `common_traps` atom
 *   check           <- `micro_exercise`, else `retrieval_prompt`
 *
 * The three optional slots ship EMPTY on purpose. An optional slot with no
 * static text and a declared resolver is precisely "nothing to say here
 * unless this particular learner needs it" — it renders for a learner whose
 * signal fires and is absent for everyone else, with no authoring cost per
 * concept and no placeholder prose in between.
 *
 * Async because atom bodies are on disk; `composeExplanation` itself stays
 * synchronous and pure, so the I/O happens once here and never per learner.
 */

import { loadConceptAtoms } from '../atom-loader';
import { VARIANT_STANCES } from '../stance-variants';
import { getConceptAnchor } from '../../registry/concept-anchors';
import { makeStanceBodyResolver } from './resolvers';
import type { AtomType, ContentAtom } from '../content-types';
import { REQUIRED_ROLES, type ExplanationFrame, type Slot, type SlotResolver } from './types';

/** Slot id -> the atom types that may fill it, in preference order. */
const SLOT_SOURCES: ReadonlyArray<{ id: string; role: Slot['role']; from: AtomType[] }> = [
  { id: 'core_idea', role: 'core_idea', from: ['intuition', 'hook'] },
  { id: 'worked_example', role: 'worked_example', from: ['worked_example'] },
  { id: 'trap', role: 'trap', from: ['common_traps'] },
  { id: 'check', role: 'check', from: ['micro_exercise', 'retrieval_prompt'] },
];

function pick(atoms: ContentAtom[], types: AtomType[]): ContentAtom | null {
  for (const t of types) {
    const hit = atoms.find(a => a.atom_type === t && (a.content ?? '').trim());
    if (hit) return hit;
  }
  return null;
}

export interface BuildResult {
  frame: ExplanationFrame | null;
  /** Roles that could not be filled from disk. Empty on a complete concept. */
  missing: string[];
  /**
   * Per-concept resolvers to hand straight to `composeExplanation`'s third
   * argument. Deliberately returned rather than registered globally: the
   * stance bodies differ per concept, so a global registration would let two
   * concepts composing at once serve each other's text.
   */
  resolvers: SlotResolver[];
}

/**
 * Build the frame, and say plainly what is missing rather than padding.
 *
 * A concept whose `common_traps` atom does not exist yet returns
 * `frame: null` plus `missing: ['trap']`. It does NOT return a frame with a
 * placeholder, because `checkFrame` would reject that anyway and a
 * placeholder would read to a student as if the trap had been considered
 * and found not to exist.
 */
export async function buildFrameForConcept(concept_id: string): Promise<BuildResult> {
  let base: ContentAtom[];
  try {
    // The loader folds stance variants itself (atom-loader.ts calls
    // foldStanceVariants inline, deliberately, so no caller can serve a
    // variant as a standalone atom). Variant bodies therefore arrive on
    // `atom.stance_variants`, NOT as separate entries — folding again here
    // would be a no-op that reads as if it were doing something.
    base = await loadConceptAtoms(concept_id);
  } catch {
    // A concept with no atoms directory at all. Report it as missing
    // everything rather than letting ConceptNotFoundError escape: a caller
    // asking "can this concept be framed?" wants an answer, not a throw.
    return { frame: null, missing: [...REQUIRED_ROLES], resolvers: [] };
  }

  const missing: string[] = [];
  const slots: Slot[] = [];

  const anchor = getConceptAnchor(concept_id);
  if (anchor && anchor.trim()) {
    slots.push({ id: 'anchor', role: 'anchor', static_text: anchor.trim() });
  } else {
    missing.push('anchor');
  }

  // stance -> slot_id -> body, harvested from the authored sibling files.
  const stanceBodies: Record<string, Record<string, string>> = {};
  for (const stance of VARIANT_STANCES) stanceBodies[stance] = {};

  for (const spec of SLOT_SOURCES) {
    const atom = pick(base, spec.from);
    if (!atom) {
      missing.push(spec.role);
      continue;
    }
    for (const stance of VARIANT_STANCES) {
      const body = atom.stance_variants?.[stance];
      if (body && body.trim()) stanceBodies[stance][spec.id] = body;
    }
    slots.push({
      id: spec.id,
      role: spec.role,
      static_text: atom.content!.trim(),
      adaptive: ['stance_body'],
    });
  }

  // Optional slots: no authored text, one declared resolver each.
  slots.push({ id: 'prerequisite_bridge', role: 'prerequisite_bridge', static_text: '', adaptive: ['prerequisite_bridge'] });
  slots.push({ id: 'board_bridge', role: 'board_bridge', static_text: '', adaptive: ['board_bridge'] });

  if (missing.length > 0) return { frame: null, missing, resolvers: [] };

  return {
    frame: { version: 1, concept_id, slots },
    missing: [],
    resolvers: [makeStanceBodyResolver(stanceBodies)],
  };
}
