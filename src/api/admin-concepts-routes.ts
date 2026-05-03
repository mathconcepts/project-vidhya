/**
 * src/api/admin-concepts-routes.ts
 *
 * Admin endpoint for autocomplete + lookup over the YAML syllabus packs.
 * Used by the RunLauncher form's concept-id combobox so operators don't
 * have to remember stable concept ids by heart.
 *
 *   GET /api/admin/concepts/search?exam=gate-ma&q=eigen[&limit=20]
 *     → returns matching concept_ids + display names from the exam's YAML
 *
 *   GET /api/admin/concepts/objectives-stub?concept_id=eigenvalues&kinds=intuition,formal_definition,practice
 *     → returns 3 default learning-objective stubs at appropriate Bloom's levels.
 *       Pure pattern-matching (no LLM call); operator edits in-place.
 *
 * Auth: requireRole('admin').
 *
 * Notes (eng-review D2): reads YAML packs ONLY (the existing sync
 * getExam path), not the DB-merged async path. Keeps the API hot path
 * fast; operator-defined packs don't need autocomplete in v1 because
 * their concept_ids come from the operator's own input.
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { requireRole } from './auth-middleware';
import { getExam } from '../curriculum/exam-loader';

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

function sendJSON(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function checkAdminAuth(req: ParsedRequest, res: ServerResponse): Promise<boolean> {
  const user = await requireRole(req, res, 'admin');
  return user !== null;
}

function badRequest(res: ServerResponse, message: string): void {
  sendJSON(res, { error: 'Bad Request', message }, 400);
}

function isString(x: unknown): x is string {
  return typeof x === 'string' && x.length > 0;
}

// ============================================================================
// Search — fuzzy concept_id + name lookup over an exam's syllabus
// ============================================================================
//
// Score = highest of:
//   - exact prefix match on concept_id (1.0)
//   - prefix match on title (0.85)
//   - substring match on either (0.6)
// Hits below 0.5 are filtered.

interface SearchHit {
  concept_id: string;
  topic_id: string;
  topic_title: string;
  score: number;
}

export function searchConcepts(examId: string, query: string, limit: number): SearchHit[] {
  const exam = getExam(examId);
  if (!exam) return [];
  const q = query.trim().toLowerCase();
  if (!q) {
    // Empty query → return first N concepts in syllabus order
    const out: SearchHit[] = [];
    for (const section of exam.syllabus) {
      for (const cid of section.concept_ids) {
        out.push({
          concept_id: cid,
          topic_id: section.id,
          topic_title: section.title,
          score: 0.5,
        });
        if (out.length >= limit) return out;
      }
    }
    return out;
  }
  const hits: SearchHit[] = [];
  for (const section of exam.syllabus) {
    for (const cid of section.concept_ids) {
      const cidLow = cid.toLowerCase();
      const titleLow = section.title.toLowerCase();
      let score = 0;
      if (cidLow.startsWith(q)) score = 1.0;
      else if (titleLow.startsWith(q)) score = 0.85;
      else if (cidLow.includes(q) || titleLow.includes(q)) score = 0.6;
      if (score >= 0.5) {
        hits.push({ concept_id: cid, topic_id: section.id, topic_title: section.title, score });
      }
    }
  }
  hits.sort((a, b) => b.score - a.score || a.concept_id.localeCompare(b.concept_id));
  return hits.slice(0, limit);
}

async function handleSearch(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;

  const exam = req.query.get('exam');
  if (!isString(exam)) return badRequest(res, 'exam query param required');
  const q = req.query.get('q') ?? '';
  const limit = Math.min(parseInt(req.query.get('limit') ?? '20', 10) || 20, 100);

  const hits = searchConcepts(exam, q, limit);
  sendJSON(res, { exam_pack_id: exam, query: q, hits, count: hits.length });
}

// ============================================================================
// Objectives stub — generates 3 starter objectives by Bloom's level
// matched to the requested atom kinds. Pure pattern matching.
// ============================================================================
//
// Mapping (loose; operator edits in-place):
//   intuition          → understand
//   formal_definition  → understand / apply
//   visual_analogy     → understand
//   worked_example     → apply
//   practice           → apply / analyze
//   common_traps       → analyze
//   exam_pattern       → analyze / evaluate
//
// We pick at most 3 distinct Bloom's levels covered by the requested
// kinds, then fill in templated objective statements that mention the
// concept name.

const KIND_TO_BLOOMS: Record<string, string> = {
  intuition: 'understand',
  formal_definition: 'understand',
  visual_analogy: 'understand',
  worked_example: 'apply',
  practice: 'apply',
  micro_exercise: 'apply',
  common_traps: 'analyze',
  exam_pattern: 'analyze',
  retrieval_prompt: 'remember',
  interactive_manipulable: 'understand',
  interactive_simulation: 'understand',
  interactive_walkthrough: 'apply',
};

const BLOOMS_TEMPLATES: Record<string, (concept: string) => string> = {
  remember:   (c) => `Recall the definition and key properties of ${c}.`,
  understand: (c) => `Explain ${c} in your own words and identify when it applies.`,
  apply:      (c) => `Solve representative problems involving ${c} step by step.`,
  analyze:    (c) => `Spot common errors and edge cases when working with ${c}.`,
  evaluate:   (c) => `Compare alternative approaches to ${c} on rigour and speed.`,
  create:     (c) => `Construct a novel example or counter-example of ${c}.`,
};

const BLOOMS_ORDER = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

export function generateObjectivesStub(concept: string, kinds: string[]): Array<{ id: string; statement: string; blooms_level: string }> {
  const conceptLabel = concept.replace(/-/g, ' ');
  const levelsHit = new Set<string>();
  for (const k of kinds) {
    const b = KIND_TO_BLOOMS[k];
    if (b) levelsHit.add(b);
  }
  if (levelsHit.size === 0) {
    // Default trio
    return [
      { id: 'obj_1', statement: BLOOMS_TEMPLATES.understand(conceptLabel), blooms_level: 'understand' },
      { id: 'obj_2', statement: BLOOMS_TEMPLATES.apply(conceptLabel), blooms_level: 'apply' },
      { id: 'obj_3', statement: BLOOMS_TEMPLATES.analyze(conceptLabel), blooms_level: 'analyze' },
    ];
  }
  // Order by Bloom's natural progression, take up to 3
  const ordered = BLOOMS_ORDER.filter((b) => levelsHit.has(b)).slice(0, 3);
  return ordered.map((b, i) => ({
    id: `obj_${i + 1}`,
    statement: BLOOMS_TEMPLATES[b]!(conceptLabel),
    blooms_level: b,
  }));
}

async function handleObjectivesStub(req: ParsedRequest, res: ServerResponse): Promise<void> {
  if (!(await checkAdminAuth(req, res))) return;

  const concept = req.query.get('concept_id');
  if (!isString(concept)) return badRequest(res, 'concept_id query param required');
  const kindsRaw = req.query.get('kinds') ?? '';
  const kinds = kindsRaw.split(',').map((s) => s.trim()).filter(Boolean);

  const objectives = generateObjectivesStub(concept, kinds);
  sendJSON(res, { concept_id: concept, objectives });
}

// ============================================================================
// Route table
// ============================================================================

export const adminConceptsRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/admin/concepts/search',          handler: handleSearch },
  { method: 'GET', path: '/api/admin/concepts/objectives-stub', handler: handleObjectivesStub },
];

// Exported for tests
export const __testing = { searchConcepts, generateObjectivesStub };
