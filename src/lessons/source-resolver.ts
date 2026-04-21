// @ts-nocheck
/**
 * Source Resolver
 *
 * Given a concept_id, collect candidate content from four sources in the
 * explicit priority order (see docs/LESSON-FRAMEWORK.md):
 *
 *   1. user-material  — student's uploaded notes, highest resonance
 *   2. bundle-canon   — curated OpenStax / OCW / GATE, trusted canonical
 *   3. wolfram        — computed examples, verified answers
 *   4. concept-graph  — minimal fallback so every concept has something
 *
 * Returns a SourceBundle that the composer consumes. Each field is
 * optional; the composer falls back component-by-component.
 *
 * Pure function (apart from file reads on bundle cold-start). No LLM
 * calls here. No network calls except Wolfram (which is opt-in and
 * guarded). Cheap to call repeatedly.
 */

import fs from 'fs';
import path from 'path';
import { ALL_CONCEPTS } from '../constants/concept-graph';
import { verifyProblemWithWolfram } from '../services/wolfram-service';
import { filterChunksForExam } from '../curriculum/guardrails';
import type { Attribution, LessonRequest } from './types';

// ============================================================================
// Bundle loading (one-shot cache per process)
// ============================================================================

interface BundleProblem {
  id: string;
  concept_id?: string;
  topic?: string;
  question_text: string;
  correct_answer?: string;
  explanation?: string;
  difficulty?: number;
  source?: string;
  verified?: boolean;
  wolfram_verified?: boolean;
  options?: string[];
}

interface BundleExplainer {
  concept_id: string;
  topic: string;
  label: string;
  canonical_definition?: string;
  deep_explanation?: string;
  worked_examples?: Array<{ problem: string; solution: string } | string>;
  common_misconceptions?: string[];
  prerequisite_reminders?: string[];
  exam_tip?: string;
}

interface ContentBundle {
  problems: BundleProblem[];
  explainers: Record<string, BundleExplainer>;
}

let _bundle: ContentBundle | null = null;

function loadBundle(): ContentBundle {
  if (_bundle) return _bundle;
  const bundle: ContentBundle = { problems: [], explainers: {} };
  try {
    const bundlePath = path.resolve(process.cwd(), 'frontend/public/data/content-bundle.json');
    if (fs.existsSync(bundlePath)) {
      const raw = JSON.parse(fs.readFileSync(bundlePath, 'utf-8'));
      bundle.problems = Array.isArray(raw.problems) ? raw.problems : [];
      bundle.explainers = raw.explainers || {};
    }
  } catch {
    // Stay safe — empty bundle just means composer uses fallbacks
  }
  _bundle = bundle;
  return bundle;
}

// ============================================================================
// Source output shape — what the composer consumes
// ============================================================================

export interface UserMaterialChunk {
  material_id: string;
  material_title: string;
  chunk_text: string;
  similarity: number;
}

export interface BundleSourceData {
  explainer: BundleExplainer | null;
  problems: BundleProblem[];       // Problems keyed on this concept
}

export interface WolframSourceData {
  verified_example: {
    problem: string;
    computed_answer: string;
  } | null;
}

export interface GraphSourceData {
  id: string;
  label: string;
  topic: string;
  description: string;
  difficulty_base: number;
  prerequisites: Array<{ id: string; label: string }>;
  dependents: Array<{ id: string; label: string }>;
}

export interface SourceBundle {
  concept_id: string;
  user_materials: UserMaterialChunk[];
  bundle: BundleSourceData;
  wolfram: WolframSourceData;
  graph: GraphSourceData;
}

// ============================================================================
// Helper: attribution builders
// ============================================================================

export function userMaterialAttribution(chunk: UserMaterialChunk): Attribution {
  return {
    kind: 'user-material',
    title: chunk.material_title,
    license: 'user-content',
    author: 'student-uploaded',
  };
}

export function bundleAttribution(source?: string, label?: string): Attribution {
  // Parse the known source strings from the bundle to attach licenses
  const s = (source || '').toLowerCase();
  if (s.includes('openstax')) {
    return {
      kind: 'bundle-canon',
      title: label ? `OpenStax — ${label}` : 'OpenStax',
      url: 'https://openstax.org',
      license: 'CC-BY-4.0',
      author: 'OpenStax',
    };
  }
  if (s.includes('ocw') || s.includes('mit')) {
    return {
      kind: 'bundle-canon',
      title: label ? `MIT OpenCourseWare — ${label}` : 'MIT OpenCourseWare',
      url: 'https://ocw.mit.edu',
      license: 'CC-BY-NC-SA-4.0',
      author: 'MIT OpenCourseWare',
    };
  }
  if (s.includes('gate')) {
    return {
      kind: 'bundle-canon',
      title: 'GATE past paper',
      license: 'public-domain',
      author: 'Govt of India',
    };
  }
  if (s.includes('nptel')) {
    return {
      kind: 'bundle-canon',
      title: label ? `NPTEL — ${label}` : 'NPTEL',
      url: 'https://nptel.ac.in',
      license: 'CC-BY-SA-4.0',
      author: 'NPTEL / IIT',
    };
  }
  if (s.includes('math-stackexchange') || s.includes('stackexchange')) {
    return {
      kind: 'bundle-canon',
      title: 'Math Stack Exchange',
      url: 'https://math.stackexchange.com',
      license: 'CC-BY-SA-4.0',
      author: 'community-contributed',
    };
  }
  return {
    kind: 'bundle-canon',
    title: label || 'Vidhya content bundle',
    license: 'mixed',
    author: 'curated',
  };
}

export function wolframAttribution(): Attribution {
  return {
    kind: 'wolfram-computed',
    title: 'Wolfram|Alpha',
    url: 'https://wolframalpha.com',
    license: 'computed',
    author: 'Wolfram Research',
  };
}

export function graphAttribution(): Attribution {
  return {
    kind: 'concept-graph',
    title: 'Vidhya concept graph',
    license: 'MIT',
    author: 'Vidhya',
  };
}

// ============================================================================
// Resolver
// ============================================================================

/**
 * Pull a SourceBundle for the requested concept.
 *
 * The `user_material_chunks` field on LessonRequest is populated by the
 * CLIENT (from its IndexedDB RAG search) and passed in — we don't
 * maintain server-side per-user storage. This keeps the DB-less
 * architecture intact.
 */
export async function resolveSources(req: LessonRequest): Promise<SourceBundle> {
  const bundle = loadBundle();
  const concept = ALL_CONCEPTS.find(c => c.id === req.concept_id);

  if (!concept) {
    // The composer will treat this as a hard fallback; graph fields are synthetic
    return {
      concept_id: req.concept_id,
      user_materials: req.user_material_chunks || [],
      bundle: { explainer: null, problems: [] },
      wolfram: { verified_example: null },
      graph: {
        id: req.concept_id,
        label: req.concept_id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        topic: 'uncategorized',
        description: 'No description available.',
        difficulty_base: 0.5,
        prerequisites: [],
        dependents: [],
      },
    };
  }

  // Bundle: explainer + up-to-3 matching problems for this concept
  const explainer = bundle.explainers[req.concept_id] || null;
  const bundleProblems = bundle.problems
    .filter(p => (p.concept_id === req.concept_id) ||
                 (p.topic === concept.topic && (p.difficulty ?? 0.5) <= concept.difficulty_base + 0.2))
    .sort((a, b) => {
      // Verified first, then same-concept before same-topic, then easier first
      const aV = a.wolfram_verified ? 2 : (a.verified ? 1 : 0);
      const bV = b.wolfram_verified ? 2 : (b.verified ? 1 : 0);
      if (aV !== bV) return bV - aV;
      const aS = a.concept_id === req.concept_id ? 1 : 0;
      const bS = b.concept_id === req.concept_id ? 1 : 0;
      if (aS !== bS) return bS - aS;
      return (a.difficulty ?? 0.5) - (b.difficulty ?? 0.5);
    })
    .slice(0, 3);

  // Wolfram: we don't call it unprompted here — that happens lazily in the
  // composer only when we need a worked example and the bundle has none.
  // Placeholder here; composer will populate.
  const wolfram: WolframSourceData = { verified_example: null };

  // Graph: prereq/dependent labels
  const prereqNodes = (concept.prerequisites || []).map(id => {
    const n = ALL_CONCEPTS.find(c => c.id === id);
    return { id, label: n?.label ?? id };
  });
  // Dependents: nodes that list this concept in THEIR prerequisites
  const dependentNodes = ALL_CONCEPTS
    .filter(c => (c.prerequisites || []).includes(req.concept_id))
    .map(c => ({ id: c.id, label: c.label }));

  // Apply curriculum guardrails: if the caller supplied an exam_id,
  // filter user material chunks against the exam's concept scope. Without
  // an exam_id, permissive (all chunks pass the similarity threshold).
  const raw_user_chunks = (req.user_material_chunks || [])
    .filter(c => c.similarity >= 0.55);
  const { allowed: guarded_user_chunks } = (req as any).exam_id
    ? filterChunksForExam(raw_user_chunks, (req as any).exam_id)
    : { allowed: raw_user_chunks };

  return {
    concept_id: req.concept_id,
    user_materials: guarded_user_chunks.slice(0, 5),
    bundle: { explainer, problems: bundleProblems },
    wolfram,
    graph: {
      id: concept.id,
      label: concept.label,
      topic: concept.topic,
      description: concept.description,
      difficulty_base: concept.difficulty_base,
      prerequisites: prereqNodes,
      dependents: dependentNodes,
    },
  };
}

/**
 * Optionally escalate to Wolfram for a live-verified example when the
 * bundle had no problem for this concept. Kept separate so the composer
 * can decide whether to pay the ~$0.002 cost based on policy.
 */
export async function fetchWolframExample(problem_text: string, candidate_answer: string): Promise<WolframSourceData> {
  try {
    const v = await verifyProblemWithWolfram(problem_text, candidate_answer);
    if (v.wolfram_answer) {
      return {
        verified_example: {
          problem: problem_text,
          computed_answer: v.wolfram_answer,
        },
      };
    }
  } catch {
    // Silent fallback — composer will skip this component
  }
  return { verified_example: null };
}
