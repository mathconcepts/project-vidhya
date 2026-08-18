/**
 * src/readiness/__tests__/t5-redirect-integration.test.ts
 *
 * T5 (A1) integration test: the prereq redirect fires through the SAME
 * class wiring production uses — ConceptGraphCurriculumRepo over the
 * real gate-ma.yml graph, SyllabusAwareReadinessEngine — rather than a
 * hand-rolled 2-3-node fake curriculum repo like the narrower unit tests
 * in syllabus-aware-engine.test.ts and content-gate.test.ts use. Only the
 * content checker and catalog are mocked (as the task calls for);
 * everything else is the real production class.
 *
 * `allowedNodes` here is a realistic multi-concept LA scope, NOT a single
 * hand-picked node — but it's also NOT literally `resolveAllowedNodes()`'s
 * current output (all 97 concept ids). That's a deliberate, documented
 * choice: `resolveAllowedNodes()` (src/api/readiness-routes.ts) returns
 * the FULL closed graph today, and with the full graph as candidates, the
 * redirect's own target node is ALWAYS already a member of the
 * prereq-eligible set computed over that same candidate list (any node
 * `findPrereqRedirect` could redirect to necessarily has only
 * non-blocking/no prereqs of its own — see collectBlockingChain's
 * post-order walk in content-gate.ts — which is exactly `eligibleNodes()`'s
 * OWN admission condition). So a content-backed redirect target would
 * already surface directly via the content-backed-eligible-set path, never
 * needing a "redirect" at all — full-graph candidates and the redirect
 * branch are mutually exclusive by construction. A1's own text ("scope
 * allowedNodes to the student's exam/topic context where known") names
 * this; that scoping work is a separate, not-yet-landed piece of A1, so
 * this test exercises the trigger-condition fix (T5's actual scope) with
 * a plausible SCOPED allowedNodes list a future exam/topic-aware caller
 * would pass.
 *
 * Real graph facts this test locks in (data/curriculum/gate-ma.yml):
 *   matrix-operations     prereqs: []
 *   determinants          prereqs: [matrix-operations]
 *   matrix-inverse        prereqs: [determinants]
 *   systems-of-equations  prereqs: [matrix-inverse]
 *   eigenvalues           prereqs: [determinants, systems-of-equations]
 */

import { describe, it, expect } from 'vitest';
import { makeSyllabusAwareReadinessEngine } from '../syllabus-aware-engine';
import { ConceptGraphCurriculumRepo } from '../../curriculum/curriculum-repo';
import type { ContentExistenceChecker } from '../content-gate';
import type { LearningObjectCatalog, CatalogQuery } from '../../scoring/learning-object-catalog';
import type { ItemSelector, LearningObject, StudentModel, TeachingPolicy } from '../../core/interfaces';

const workedExampleFor = (nodeId: string): LearningObject => ({
  id: `wex_${nodeId}`,
  nodeId,
  type: 'worked_example',
  difficulty: 1500,
  estMinutes: 5,
  prereqs: [],
  verification: 'human_verified',
  payload: { skillId: nodeId },
});

/** Mock catalog — real catalog shape, fake data: only `contentBackedSkills` serve anything. */
function fakeCatalog(contentBackedSkills: ReadonlySet<string>): LearningObjectCatalog {
  return {
    async query(q: CatalogQuery) {
      if (!contentBackedSkills.has(q.skillId)) return [];
      if (q.types && q.types.length > 0 && !q.types.includes('worked_example')) return [];
      return [workedExampleFor(q.skillId)];
    },
  };
}

/** Mock content checker — real interface shape, fake data. */
function fakeContentChecker(contentBackedSkills: ReadonlySet<string>): ContentExistenceChecker {
  return { async hasContent(id) { return contentBackedSkills.has(id); } };
}

function freshStudentModel(): StudentModel {
  return {
    async abilityFor() { return { rating: 1500, confidence: 0, n: 0 }; },
    async masteryState() { return 'not-started'; }, // truly fresh — nothing attempted anywhere
    async retrievability() { return 0; },
    async errorProfile() { return { weights: {}, n: 0 }; },
    async update() {},
  };
}

const selectorReturningNothing: ItemSelector = { async selectNext() { return null; } };
const teachPolicy: TeachingPolicy = { async selectObject(_s, _n, candidates) { return candidates[0] ?? null; } };
const syllabusFarOut = { examDate: async () => null, coverage: async () => 0 };

// A realistic "student intent scoped to LA, downstream of the entry
// point" candidate list — deliberately excludes the true graph root
// (matrix-operations) from `allowedNodes`, the way a caller scoping to
// "concepts still ahead of you" naturally would.
const LA_DOWNSTREAM_SCOPE = ['eigenvalues', 'systems-of-equations', 'matrix-inverse', 'determinants'];

describe('T5 marquee fix — prereq redirect reachable via the production engine wiring', () => {
  it('fresh student, content-starved eligible set: redirects to the real content-backed prerequisite', async () => {
    const contentBackedSkills = new Set(['matrix-operations']);
    const catalog = fakeCatalog(contentBackedSkills);
    const curriculum = new ConceptGraphCurriculumRepo({ catalog });

    const engine = makeSyllabusAwareReadinessEngine({
      studentModel: freshStudentModel(),
      curriculum,
      selector: selectorReturningNothing,
      policy: teachPolicy,
      syllabus: syllabusFarOut,
      content: fakeContentChecker(contentBackedSkills),
    });

    const action = await engine.nextBestAction('fresh-student', {
      timeBudgetMin: 15,
      allowedNodes: LA_DOWNSTREAM_SCOPE,
    });

    // Every candidate in scope is prereq-blocked (fresh student) AND
    // content-starved (none of the 4 scoped concepts have content) — the
    // pre-T5 code would have surfaced `eligible` (empty here, so it
    // would've hit the old rescue) OR, on a richer graph where `eligible`
    // is non-empty but content-less, would have recommended a dead-end
    // node. T5 requires BOTH prereq-eligibility AND content; here that
    // forces the redirect to fire — landing on the real, content-backed
    // root of the chain instead of "building your baseline".
    expect(action.kind).toBe('teach');
    expect(action.nodeId).toBe('matrix-operations');
    expect(action.objectId).toBe('wex_matrix-operations');
    expect(action.rationale).toMatch(/Not ready for .+ yet — matrix-operations first/);
  });

  it('fresh student, nothing content-backed anywhere: honest fallback, never crashes or fabricates', async () => {
    const contentBackedSkills = new Set<string>(); // nothing has content
    const catalog = fakeCatalog(contentBackedSkills);
    const curriculum = new ConceptGraphCurriculumRepo({ catalog });

    const engine = makeSyllabusAwareReadinessEngine({
      studentModel: freshStudentModel(),
      curriculum,
      selector: selectorReturningNothing,
      policy: teachPolicy,
      syllabus: syllabusFarOut,
      content: fakeContentChecker(contentBackedSkills),
    });

    const action = await engine.nextBestAction('fresh-student', {
      timeBudgetMin: 15,
      allowedNodes: LA_DOWNSTREAM_SCOPE,
    });

    // No redirect exists (every chain bottoms at a content-less root) —
    // the defensive rescue-to-original-set kicks in, and since NONE of
    // those nodes can serve a teach/practice/retain object either, the
    // engine honestly falls back to diagnose. Never a fabricated action.
    expect(action.kind).toBe('diagnose');
    expect(action.objectId).toBeUndefined();
    expect(action.rationale).not.toMatch(/Not ready for/);
  });
});
