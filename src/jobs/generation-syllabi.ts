/**
 * generation-syllabi.ts — syllabus resolution for the content-generation job.
 *
 * NOT "the syllabus registry" from claude/2026-07-30-Content-Strategy-v2.md §3
 * (that's data/curriculum/<exam>.yml + src/curriculum/exam-loader.ts — the
 * design doc names that pairing "the syllabus registry" and plans for
 * concept-graph.ts to migrate into it as canonical during Loop A; that
 * migration has NOT happened yet). This file is a narrow, job-local adapter
 * so content-generation-job.ts can be parametrized by VIDHYA_SYLLABUS today,
 * wired against the exam-loader that ALREADY auto-discovers every
 * data/curriculum/*.yml file with zero code change per new exam
 * (docs/CURRICULUM-FRAMEWORK.md §6/§7 — this part is genuinely implemented).
 * When Loop A ships, delete this file and have the job read concepts
 * directly off the unified registry.
 *
 * Scope rule (why gate-ma is special-cased):
 *   - concept-graph.ts today is GATE-only (82 concepts) and IS the
 *     authoritative concept universe for GATE. data/curriculum/gate-ma.yml's
 *     `syllabus:` concept_ids are an intentionally partial, in-progress
 *     curation (currently 27/82 — CURRICULUM-FRAMEWORK.md calls this file
 *     "first exemplar exam definition") used for weight/depth/emphasis
 *     metadata (§3, §8 — the Lesson composer's filtering), not a generation
 *     scope. Trusting the YAML for gate-ma would silently drop 55 concepts
 *     from generation — a regression versus current behavior. So gate-ma
 *     keeps the full graph.
 *   - Every OTHER exam has no such native mapping in concept-graph.ts, so its
 *     generation scope is exactly what data/curriculum/<exam>.yml declares,
 *     intersected with whatever concepts already exist in the shared graph.
 *     For a Phase-1 stub like jee-main (concept_ids not yet in
 *     concept-graph.ts — see jee-main.yml's own header comment, and
 *     Content-Strategy-v2.md defect #7 "JEE has no substrate") that
 *     intersection is legitimately empty today; contentGenerationJob's
 *     preflight refuses with an honest message instead of silently
 *     generating nothing.
 *   - Onboarding real content generation for a new exam is therefore exactly
 *     what docs/CURRICULUM-FRAMEWORK.md §6 already documents: (1) write
 *     data/curriculum/<exam-id>.yml, (2) link its concept_ids into
 *     concept-graph.ts (one entry each, with real prerequisites). No change
 *     to this file or to content-generation-job.ts is needed either step.
 *   - Multi-Exam-Expansion-Design.md's D1 decision ("JEE gate STANDS... waits
 *     for GATE's 5-real-user checkpoint") is respected as a side effect: JEE
 *     concepts simply aren't in concept-graph.ts yet, so jee-main resolves to
 *     zero generatable concepts until that gate lifts and someone does the
 *     authoring step above.
 */

import { ALL_CONCEPTS, CONCEPT_MAP, type ConceptNode } from '../constants/concept-graph';
import { listExamIds, getExam } from '../curriculum/exam-loader';
import type { SyllabusSection } from '../curriculum/types';

export interface Syllabus {
  id: string;
  name: string;
  /** Concepts resolvable in concept-graph.ts — the actual generation scope. */
  concepts: ConceptNode[];
  /** concept_ids this exam's YAML declares that concept-graph.ts doesn't have yet. */
  unresolvedConceptIds: string[];
  /** '' = gate-ma's existing unprefixed atom layout; else nested under this id. */
  atomsSubdir: string;
}

export const DEFAULT_SYLLABUS_ID = 'gate-ma';

function flattenConceptIds(sections: SyllabusSection[]): string[] {
  const ids: string[] = [];
  for (const s of sections) {
    ids.push(...s.concept_ids);
    if (s.sub_sections?.length) ids.push(...flattenConceptIds(s.sub_sections));
  }
  return ids;
}

/** Registered syllabus ids — every data/curriculum/*.yml file, auto-discovered. */
export function listSyllabusIds(): string[] {
  return listExamIds();
}

export function getSyllabus(id: string = DEFAULT_SYLLABUS_ID): Syllabus {
  const exam = getExam(id);
  if (!exam) {
    throw new Error(`unknown syllabus "${id}" — registered: ${listSyllabusIds().join(', ')}`);
  }

  if (id === DEFAULT_SYLLABUS_ID) {
    // gate-ma: concept-graph.ts is the full, authoritative scope (see docblock above).
    return {
      id,
      name: exam.metadata.name,
      concepts: ALL_CONCEPTS,
      unresolvedConceptIds: [],
      atomsSubdir: '',
    };
  }

  const declaredIds = Array.from(new Set(flattenConceptIds(exam.syllabus)));
  const concepts: ConceptNode[] = [];
  const unresolvedConceptIds: string[] = [];
  for (const cid of declaredIds) {
    const node = CONCEPT_MAP.get(cid);
    if (node) concepts.push(node);
    else unresolvedConceptIds.push(cid);
  }

  return {
    id,
    name: exam.metadata.name,
    concepts,
    unresolvedConceptIds,
    atomsSubdir: id,
  };
}
