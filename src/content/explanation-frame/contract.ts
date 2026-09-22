/**
 * The contract every ExplanationFrame and every SlotResolver must pass.
 *
 * Same shape as `marking-strategy-contract.ts` and EXTENDING.md's other
 * extension contracts: a pure function returning a list of problems, run by
 * a test and by the CI gate, so a new frame or resolver cannot be added
 * without satisfying the two guarantees in `types.ts`.
 *
 * The reason this is a contract and not review discipline: G1 fails
 * SILENTLY. A frame missing its `trap` slot still renders, still reads
 * fluently, and simply never warns the student about the mistake that costs
 * them the mark. Nothing at runtime would notice.
 */

import {
  type ExplanationFrame,
  type Slot,
  type SlotResolver,
  type LearnerSignals,
  REQUIRED_ROLES,
  ALL_ROLES,
  NO_SIGNALS,
  isRequiredRole,
} from './types';

export interface ContractProblem {
  code: string;
  detail: string;
}

/**
 * Structural checks on a frame. Does not run resolvers — `checkResolver`
 * and `checkComposition` do that.
 */
export function checkFrame(frame: ExplanationFrame): ContractProblem[] {
  const problems: ContractProblem[] = [];

  if (frame.version !== 1) {
    problems.push({ code: 'bad_version', detail: `version must be 1, got ${String(frame.version)}` });
  }
  if (!frame.concept_id || !frame.concept_id.trim()) {
    problems.push({ code: 'missing_concept_id', detail: 'concept_id is required' });
  }

  const seen = new Set<string>();
  for (const slot of frame.slots) {
    if (seen.has(slot.id)) {
      problems.push({ code: 'duplicate_slot_id', detail: `slot id '${slot.id}' appears more than once` });
    }
    seen.add(slot.id);

    if (!(ALL_ROLES as readonly string[]).includes(slot.role)) {
      problems.push({ code: 'unknown_role', detail: `slot '${slot.id}' has unknown role '${slot.role}'` });
    }

    // G1, stated per slot: a required role with empty static text means the
    // zero-signal rendering is incomplete, and no resolver can be counted on
    // to rescue it — a resolver declining is the normal case, not the
    // exceptional one.
    if (isRequiredRole(slot.role) && !slot.static_text.trim()) {
      problems.push({
        code: 'required_role_empty',
        detail: `slot '${slot.id}' fills required role '${slot.role}' but its static_text is empty — the floor would not hold for a learner with no signals`,
      });
    }
  }

  const filled = new Set(frame.slots.map(s => s.role));
  for (const role of REQUIRED_ROLES) {
    if (!filled.has(role)) {
      problems.push({ code: 'missing_required_role', detail: `no slot fills required role '${role}'` });
    }
  }

  return problems;
}

/** Structural checks on a resolver, run at registration. */
export function checkResolver(resolver: SlotResolver): ContractProblem[] {
  const problems: ContractProblem[] = [];
  if (!resolver.id || !resolver.id.trim()) {
    problems.push({ code: 'missing_resolver_id', detail: 'resolver id is required' });
  }
  if (!resolver.reads || !resolver.reads.trim()) {
    problems.push({
      code: 'missing_reads',
      detail: `resolver '${resolver.id}' must state which signal it reads — an unexplained resolver cannot be reviewed`,
    });
  }
  if (resolver.roles.length === 0) {
    problems.push({ code: 'no_roles', detail: `resolver '${resolver.id}' declares no roles` });
  }
  for (const role of resolver.roles) {
    if (!(ALL_ROLES as readonly string[]).includes(role)) {
      problems.push({ code: 'unknown_role', detail: `resolver '${resolver.id}' declares unknown role '${role}'` });
    }
  }

  // G2, the cheap half: with no signals at all, a resolver must decline.
  // A resolver that fires on NO_SIGNALS is not adaptive — it is static text
  // hiding in a resolver, and it would make the floor depend on resolver
  // registration order.
  for (const role of resolver.roles) {
    let out: string | null;
    try {
      out = resolver.resolve({
        concept_id: '__contract_probe__',
        slot_id: '__contract_probe_slot__',
        role,
        signals: NO_SIGNALS,
        static_text: 'FLOOR',
      });
    } catch (err) {
      problems.push({
        code: 'throws_on_no_signals',
        detail: `resolver '${resolver.id}' threw on the zero-signal probe (${String(err)}) — resolvers must decline, never throw`,
      });
      break;
    }
    if (out !== null && out !== '') {
      problems.push({
        code: 'fires_without_signals',
        detail: `resolver '${resolver.id}' returned text for role '${role}' with no signals — that text belongs in static_text`,
      });
      break;
    }
  }

  return problems;
}

/**
 * G1 and G2 checked against an actual composition, which is the only way to
 * catch a resolver that deletes content.
 *
 * `compose` is injected rather than imported so this module stays free of a
 * cycle with `compose.ts` (which imports these types).
 */
export function checkComposition(
  frame: ExplanationFrame,
  compose: (f: ExplanationFrame, s: LearnerSignals) => { slots: readonly { role: string; text: string }[] },
  richSignals: LearnerSignals,
): ContractProblem[] {
  const problems: ContractProblem[] = [];

  const floor = compose(frame, NO_SIGNALS);
  for (const role of REQUIRED_ROLES) {
    const got = floor.slots.find(s => s.role === role);
    if (!got || !got.text.trim()) {
      problems.push({
        code: 'floor_incomplete',
        detail: `G1 violated: composing with no signals left required role '${role}' empty`,
      });
    }
  }

  const rich = compose(frame, richSignals);
  for (const role of REQUIRED_ROLES) {
    const got = rich.slots.find(s => s.role === role);
    if (!got || !got.text.trim()) {
      problems.push({
        code: 'enrichment_regressed',
        detail: `G2 violated: with signals present, required role '${role}' came out empty — a resolver removed content instead of replacing it`,
      });
    }
  }

  return problems;
}

/**
 * The single entry point an implementer runs, mirroring
 * `runMarkingStrategyContract`. Throws with every problem listed at once,
 * rather than failing on the first, so a new frame is fixed in one pass.
 */
export function runExplanationFrameContract(
  frame: ExplanationFrame,
  compose: (f: ExplanationFrame, s: LearnerSignals) => { slots: readonly { role: string; text: string }[] },
  richSignals: LearnerSignals,
): void {
  const problems = [...checkFrame(frame), ...checkComposition(frame, compose, richSignals)];
  if (problems.length > 0) {
    throw new Error(
      `ExplanationFrame contract failed for '${frame.concept_id}':\n` +
        problems.map(p => `  [${p.code}] ${p.detail}`).join('\n'),
    );
  }
}

/** Convenience for tests that only need the structural half. */
export function assertSlotShape(slot: Slot): void {
  if (isRequiredRole(slot.role) && !slot.static_text.trim()) {
    throw new Error(`slot '${slot.id}': required role '${slot.role}' has empty static_text`);
  }
}
