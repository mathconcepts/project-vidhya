/**
 * Slot resolvers — the variable half of the framework.
 *
 * Hard rule for this file: a resolver may only exist when the signal it
 * reads is REAL and the text it produces comes from something already
 * authored and already gated. No resolver invents pedagogy at request time.
 *
 * That is why there are three here and not ten. `delta-kinds.ts` names
 * eleven reasons a personalised delta might fire and is explicit that only
 * one has a trigger detector today; shipping eleven resolvers against two
 * real detectors would repeat exactly the mistake that file went out of its
 * way to avoid. Each further resolver arrives with its own detector, or not
 * at all.
 */

import { getPrerequisites, ALL_CONCEPTS } from '../../constants/concept-graph';
import { bridgeFor } from '../../registry/curriculum-bridge';
import { checkResolver } from './contract';
import type { SlotResolver, ResolverContext, SlotRole } from './types';

// ============================================================================
// Registry
// ============================================================================

const _registry = new Map<string, SlotResolver>();

/**
 * Register a resolver, refusing one that fails the contract.
 *
 * Refusing at registration rather than at compose time is deliberate: a
 * resolver that fires without signals would silently change the floor for
 * every learner, and it would do so depending on import order.
 */
export function registerResolver(resolver: SlotResolver): void {
  const problems = checkResolver(resolver);
  if (problems.length > 0) {
    throw new Error(
      `SlotResolver '${resolver.id}' failed the contract:\n` +
        problems.map(p => `  [${p.code}] ${p.detail}`).join('\n'),
    );
  }
  _registry.set(resolver.id, resolver);
}

export function getResolver(id: string): SlotResolver | undefined {
  return _registry.get(id);
}

export function listResolvers(): SlotResolver[] {
  return [..._registry.values()];
}

/** Test hook — drops every registration, including the built-ins below. */
export function resetResolvers(): void {
  _registry.clear();
}

// ============================================================================
// Built-in resolvers
// ============================================================================

function labelFor(conceptId: string): string | null {
  const node = ALL_CONCEPTS.find(c => c.id === conceptId);
  return node?.label ?? null;
}

/**
 * Names the prerequisite the learner is actually weak on, so the
 * explanation can lean on it explicitly instead of assuming it.
 *
 * Signal: `shaky_prerequisites`, written by the existing prerequisite-alert
 * path (`refreshPrerequisiteAlerts`, src/gbrain/student-model.ts). Only
 * prerequisites that are genuinely upstream of THIS concept in the graph
 * count — an alert about an unrelated concept is not a reason to mention it
 * here, and mentioning it would read as a non-sequitur.
 */
export const prerequisiteBridgeResolver: SlotResolver = {
  id: 'prerequisite_bridge',
  roles: ['prerequisite_bridge'],
  reads: 'shaky_prerequisites, intersected with this concept\'s own prerequisites in the concept graph',
  resolve(ctx: ResolverContext): string | null {
    const shaky = ctx.signals.shaky_prerequisites;
    if (!shaky || shaky.length === 0) return null;
    const upstream = new Set(getPrerequisites(ctx.concept_id).map(c => c.id));
    const hit = shaky.find(id => upstream.has(id));
    if (!hit) return null;
    const label = labelFor(hit);
    if (!label) return null;
    // Plain, non-judgemental, and specific. Never "you are weak at X" — the
    // student reading this already knows the topic is hard, and a label
    // costs confidence without adding information.
    return `This leans on ${label}. If that part feels shaky, it is worth a quick look first — the step below will make more sense with it fresh.`;
  },
};

/**
 * Tells a board student whether this is revision or genuinely new.
 *
 * Signal: `track_id` (their registered knowledge track) joined against the
 * curriculum-bridge registry, which is per-concept, per-board, authored,
 * and already gated by `ci:curriculum-bridge` — including its ban on alarm
 * framing. Nothing here is inferred about the individual: a bridge entry is
 * a claim about a PUBLISHED SYLLABUS, identical for everyone on that track.
 */
export const boardBridgeResolver: SlotResolver = {
  id: 'board_bridge',
  roles: ['board_bridge'],
  reads: 'track_id, joined to the per-concept curriculum-bridge registry',
  resolve(ctx: ResolverContext): string | null {
    const track = ctx.signals.track_id;
    if (!track) return null;
    try {
      const entry = bridgeFor(track, ctx.concept_id);
      return entry?.bridge?.trim() || null;
    } catch {
      // A missing or unreadable bridge file is not a reason to fail a
      // lesson — the slot is optional and simply does not render.
      return null;
    }
  },
};

/**
 * Serves an authored stance variant of a required role.
 *
 * A factory rather than a singleton because the alternate bodies live on
 * disk next to the atom (`intuition-shaken.md`), and the caller that built
 * the frame has already loaded them. Passing them in keeps this module free
 * of file I/O and keeps `compose` synchronous.
 *
 * This is the piece that turns stance variants from a whole-file swap into
 * a declared slot-level delta: the base body stays the floor, and the
 * variant replaces exactly one slot when the stance signal supports it.
 */
export function makeStanceBodyResolver(
  /** stance -> slot_id -> authored body. */
  bodies: Readonly<Record<string, Partial<Record<string, string>>>>,
  roles: readonly SlotRole[] = ['core_idea', 'worked_example'],
): SlotResolver {
  return {
    id: 'stance_body',
    roles,
    reads: 'stance, matched against authored -shaken / -assured sibling bodies for this slot',
    resolve(ctx: ResolverContext): string | null {
      const stance = ctx.signals.stance;
      // 'steady' IS the base file by construction (see stance-variants.ts):
      // treating it as a variant would mean two files claiming to be the
      // default, with load order picking the winner.
      if (!stance || stance === 'steady') return null;
      const forStance = bodies[stance];
      if (!forStance) return null;
      const text = forStance[ctx.slot_id] ?? null;
      return text && text.trim() ? text : null;
    },
  };
}

/** Registers the two signal-backed built-ins. Idempotent. */
export function registerBuiltInResolvers(): void {
  registerResolver(prerequisiteBridgeResolver);
  registerResolver(boardBridgeResolver);
}

registerBuiltInResolvers();
