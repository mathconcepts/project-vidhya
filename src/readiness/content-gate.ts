/**
 * src/readiness/content-gate.ts — U1-5: "LA-chain on-ramp."
 *
 * Backlog: next-best-action should redirect a student to an unmet
 * prerequisite ONLY where real explainer content exists behind every
 * door in that prerequisite chain. Today this is true for Linear
 * Algebra (chapter-ified per CONTENT-TIERS.md/CONTENT.md) and false for
 * the rest of GATE-EM — but the rule below never names a topic or exam.
 * It is purely: "does explainer content exist for every node in the
 * unmet-prereq chain?" That happens to be true only for LA today because
 * that's the only topic with real content, not because LA is special-
 * cased anywhere in this file (see scripts/fork-test-lint.mjs, which
 * enforces exactly this for src/core, src/gbrain, src/readiness,
 * src/scoring).
 *
 * "Labels never lie": partially redirecting (some doors real, some
 * stubs) is worse than not redirecting at all, so a single missing/
 * broken link anywhere in the chain suppresses the WHOLE redirect —
 * never a partial one.
 *
 * Pure logic here — no fs, no DB, no LLM. `ContentExistenceChecker` is
 * the injection seam; the concrete disk-backed implementation lives in
 * `src/readiness/atom-content-checker.ts` (imports `src/content/
 * atom-loader.ts`, kept out of this file so this module stays testable
 * with a trivial fake).
 */

import type { ConceptId, CurriculumRepo, StudentId, StudentModel } from '../core/interfaces';

// ────────────────────────────────────────────────────────────────────
// Injection seam
// ────────────────────────────────────────────────────────────────────

export interface ContentExistenceChecker {
  /**
   * True iff real, non-placeholder explainer content exists for this
   * concept right now. Implementations MUST fail closed (return false,
   * never throw past the caller) — this function backs a "never
   * fabricate" guarantee.
   */
  hasContent(conceptId: ConceptId): Promise<boolean>;
}

export interface PrereqRedirect {
  /** The node to actually route the student to instead of the original target. */
  redirectTo: ConceptId;
  /**
   * The full unmet-prereq chain from the already-mastered boundary up to
   * (but excluding) the original node, foundational-first. `redirectTo`
   * is always `chain[0]` — the first door the student should walk
   * through. Every id in this array is confirmed content-backed.
   */
  chain: ConceptId[];
  /** The node the student originally asked for / was scoped to. */
  originalNodeId: ConceptId;
}

export interface PrereqRedirectDeps {
  curriculum: CurriculumRepo;
  studentModel: Pick<StudentModel, 'masteryState'>;
  content: ContentExistenceChecker;
}

// States that unblock a prereq edge — mirrors syllabus-context.ts's
// eligibleNodes() so the two stay in lockstep (this module intentionally
// reuses that vocabulary rather than redefining its own).
function isBlocking(state: string): boolean {
  return state === 'not-started' || state === 'learning';
}

/**
 * Depth-first, post-order walk of the unmet-prereq graph rooted at
 * `nodeId`. Recursion stops the moment a prereq edge is already
 * unblocked (mastered/practicing/at-risk) — that's the "already-mastered
 * boundary" the backlog item refers to. `visited` guards both cycles and
 * diamond-shaped prereq graphs (a shared grandparent is only walked
 * once, but every distinct blocking node it introduces is still added).
 *
 * Post-order means `chain` fills foundational-first: a node's own
 * blocking prereqs are appended before the node itself.
 */
async function collectBlockingChain(
  nodeId: ConceptId,
  studentId: StudentId,
  deps: PrereqRedirectDeps,
  visited: Set<ConceptId>,
  chain: ConceptId[],
): Promise<void> {
  const node = await deps.curriculum.getNode(nodeId);
  if (!node) return;

  for (const prereqId of node.prereqs) {
    if (visited.has(prereqId)) continue;
    visited.add(prereqId);

    const state = await deps.studentModel.masteryState(studentId, prereqId);
    if (!isBlocking(state)) continue; // already-mastered boundary — stop here

    await collectBlockingChain(prereqId, studentId, deps, visited, chain);
    chain.push(prereqId);
  }
}

/**
 * `findPrereqRedirect(nodeId, studentId, deps) → Promise<PrereqRedirect | null>`
 *
 * Walks the FULL unmet-prerequisite chain behind `nodeId` back to
 * whatever already-mastered boundary exists, then checks — for EVERY
 * node in that chain — that `deps.content.hasContent()` is true. Only
 * when every single link passes does this return a redirect; a single
 * missing/failed link anywhere in the chain returns `null` (no partial
 * redirect, ever). Returns `null` immediately if `nodeId` has no unmet
 * prereqs at all (nothing to redirect to — normal behavior applies).
 */
export async function findPrereqRedirect(
  nodeId: ConceptId,
  studentId: StudentId,
  deps: PrereqRedirectDeps,
): Promise<PrereqRedirect | null> {
  const chain: ConceptId[] = [];
  await collectBlockingChain(nodeId, studentId, deps, new Set<ConceptId>([nodeId]), chain);

  if (chain.length === 0) return null; // no prerequisite gap — nothing to redirect to

  for (const id of chain) {
    let ok: boolean;
    try {
      ok = await deps.content.hasContent(id);
    } catch {
      ok = false; // never fabricate — a checker error means "assume no content"
    }
    if (!ok) return null; // one broken/missing link suppresses the WHOLE redirect
  }

  return { redirectTo: chain[0], chain, originalNodeId: nodeId };
}

/**
 * Convenience for the common case of several candidate nodes that are
 * all currently prereq-blocked (e.g. every entry in `allowedNodes`):
 * returns the first content-backed redirect found, in candidate order,
 * or `null` if none of them qualifies.
 */
export async function findFirstPrereqRedirect(
  candidates: ReadonlyArray<ConceptId>,
  studentId: StudentId,
  deps: PrereqRedirectDeps,
): Promise<PrereqRedirect | null> {
  for (const id of candidates) {
    const redirect = await findPrereqRedirect(id, studentId, deps);
    if (redirect) return redirect;
  }
  return null;
}
