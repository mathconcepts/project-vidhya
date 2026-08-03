/**
 * Graph browser routes — Mission Control, "Graph editor" panel
 * (SOTA-Facelift-CEO-Review.md §7). Deliberately scoped DOWN from a full
 * editor to a read-only browser this batch:
 *
 *   - §7's Phase-1 panel list names "graph editor", but §15's own
 *     phase-sequencing table places full graph editing + versioning +
 *     publish/rollback in **Phase 2 ("Graph Product")**, not Phase 1. That
 *     is a real discrepancy inside the same document — we're resolving it
 *     in favor of §15 (the more specific, load-bearing sequencing table)
 *     rather than attempting a full CRUD+versioning editor unreviewed.
 *   - What ships now: a read-only concept table (topic, difficulty,
 *     frequency, prerequisites), a live DAG-integrity check, and an exam
 *     picker showing each exam's declared-but-unresolved ("stub")
 *     concept ids. Editing a concept, adding an edge, or publishing a new
 *     graph version are all Phase 2 per the CEO doc's own sequencing —
 *     not silently dropped, just not attempted here.
 *
 *   GET /api/admin/graph/summary
 */

import type { ServerResponse } from 'http';
import { sendJSON, type ParsedRequest, type RouteHandler } from '../lib/route-helpers';
import { requireAnyRole } from '../auth/middleware';
import type { Role } from '../auth/types';
import { ALL_CONCEPTS, type ConceptNode } from '../constants/concept-graph';
import { findPrerequisiteCycle } from '../curriculum/prereq-cycles';
import { listExamIds, getExam, listSyllabusIds } from '../curriculum/exam-loader';

const ADMIN_ROLES: Role[] = ['admin', 'owner', 'institution'];

export interface ConceptSummary {
  id: string;
  topic: string;
  label: string;
  difficulty_base: number;
  gate_frequency: ConceptNode['gate_frequency'];
  prerequisites: string[];
}

/** Pure — the concept table's rows. Exported for tests. */
export function buildConceptSummaries(concepts: ConceptNode[]): ConceptSummary[] {
  return concepts.map((c) => ({
    id: c.id,
    topic: c.topic,
    label: c.label,
    difficulty_base: c.difficulty_base,
    gate_frequency: c.gate_frequency,
    prerequisites: c.prerequisites,
  }));
}

export interface ExamSummary {
  id: string;
  name: string;
  is_registered_syllabus: boolean;
  declared_concept_count: number;
  stub_concept_ids: string[];
}

/** Pure — one row per registered exam YAML, cross-referenced against the
 *  generation-syllabus list (a stub-only exam like a fresh jee-main pack
 *  is registered but may have zero generation-ready concepts today).
 *  Exported for tests. */
export function buildExamSummaries(examIds: string[]): ExamSummary[] {
  const syllabusIds = new Set(listSyllabusIds());
  const summaries: ExamSummary[] = [];
  for (const id of examIds) {
    const exam = getExam(id);
    if (!exam) continue;
    const declaredCount =
      exam.syllabus.reduce((n, s) => n + countSectionConcepts(s), 0);
    summaries.push({
      id,
      name: exam.metadata.name,
      is_registered_syllabus: syllabusIds.has(id),
      declared_concept_count: declaredCount,
      stub_concept_ids: exam.stub_concept_ids,
    });
  }
  return summaries;
}

function countSectionConcepts(section: { concept_ids: string[]; sub_sections?: any[] }): number {
  let n = section.concept_ids.length;
  for (const sub of section.sub_sections ?? []) n += countSectionConcepts(sub);
  return n;
}

async function handleSummary(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const auth = await requireAnyRole(req, res, ADMIN_ROLES);
  if (!auth) return;

  // Live re-check, on top of the load-time assertion in concept-graph.ts
  // (assertNoPrerequisiteCycles) — the loader already refuses to boot the
  // server on a cyclic graph, so this should always report clean today.
  // It's here so the invariant is visibly confirmed from the admin surface
  // itself (not just "trust that nothing crashed on boot"), and so it
  // keeps meaning something once Phase 2 lets exam packs carry their own
  // graphs independent of the shared gate-ma one.
  const cycle = findPrerequisiteCycle(ALL_CONCEPTS.map((c) => ({ id: c.id, prerequisites: c.prerequisites })));

  sendJSON(res, {
    generated_at: new Date().toISOString(),
    concepts: buildConceptSummaries(ALL_CONCEPTS),
    dag_health: {
      ok: cycle === null,
      cycle,
    },
    exams: buildExamSummaries(listExamIds()),
  });
}

export const graphRoutes: Array<{ method: string; path: string; handler: RouteHandler }> = [
  { method: 'GET', path: '/api/admin/graph/summary', handler: handleSummary },
];

export const __testing = { buildConceptSummaries, buildExamSummaries };
