/**
 * composeExplanation — turn a frame plus whatever signals exist into text.
 *
 * Pure and synchronous. No I/O, no clock, no randomness: the same frame and
 * the same signals produce byte-identical output forever, which is what
 * lets a lift experiment group by `enrichment_level` and mean something.
 *
 * The whole method is three lines of policy, and they are the two
 * guarantees from `types.ts` made operational:
 *
 *   1. Start from the authored static text. Always.
 *   2. Ask each declared resolver in order; the first that returns
 *      non-empty text REPLACES that slot's text.
 *   3. Drop a slot only when it ends up empty AND its role is optional.
 *
 * Step 3 is where G2 lives. A required role can never be dropped, because
 * step 1 guaranteed it started non-empty and a resolver returning '' is
 * treated as a decline, not as an instruction to delete.
 */

import {
  type ComposedExplanation,
  type ExplanationFrame,
  type LearnerSignals,
  type SlotResolution,
  NO_SIGNALS,
  isRequiredRole,
} from './types';
import { getResolver } from './resolvers';
import type { SlotResolver } from './types';

/**
 * `local` resolvers are consulted before the global registry and are never
 * stored. That is how a per-concept resolver (the stance bodies, which
 * differ for every concept) is supplied without mutating global state —
 * two concepts composing concurrently would otherwise race for the same
 * registry key and serve each other's text.
 */
export function composeExplanation(
  frame: ExplanationFrame,
  signals: LearnerSignals = NO_SIGNALS,
  local: readonly SlotResolver[] = [],
): ComposedExplanation {
  const localById = new Map(local.map(r => [r.id, r]));
  const out: SlotResolution[] = [];
  let enrichment = 0;

  for (const slot of frame.slots) {
    let text = slot.static_text;
    let source: 'static' | 'adaptive' = 'static';
    let resolverId: string | undefined;

    for (const id of slot.adaptive ?? []) {
      const resolver = localById.get(id) ?? getResolver(id);
      // An unregistered id is a no-op, not a throw. A frame authored
      // against a resolver that a given deployment does not register must
      // still render — that is the whole point of the floor.
      if (!resolver) continue;
      if (!resolver.roles.includes(slot.role)) continue;

      let produced: string | null;
      try {
        produced = resolver.resolve({
          concept_id: frame.concept_id,
          slot_id: slot.id,
          role: slot.role,
          signals,
          static_text: slot.static_text,
        });
      } catch {
        // A resolver blowing up must never cost the learner the slot's
        // authored text. Swallow, keep the floor, try the next one.
        continue;
      }

      if (produced && produced.trim()) {
        text = produced;
        source = 'adaptive';
        resolverId = resolver.id;
        enrichment += 1;
        break;
      }
    }

    if (!text.trim() && !isRequiredRole(slot.role)) continue;

    out.push({
      slot_id: slot.id,
      role: slot.role,
      text,
      source,
      ...(resolverId ? { resolver_id: resolverId } : {}),
    });
  }

  return { concept_id: frame.concept_id, slots: out, enrichment_level: enrichment };
}

/**
 * The floor, named so call sites read as intent rather than as an argument
 * they forgot to pass.
 */
export function composeFloor(
  frame: ExplanationFrame,
  local: readonly SlotResolver[] = [],
): ComposedExplanation {
  return composeExplanation(frame, NO_SIGNALS, local);
}

/** Flatten to plain text, in slot order. */
export function renderText(composed: ComposedExplanation): string {
  return composed.slots.map(s => s.text.trim()).filter(Boolean).join('\n\n');
}
