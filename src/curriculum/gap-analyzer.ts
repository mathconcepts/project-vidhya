// @ts-nocheck
/**
 * Gap Analyzer
 *
 * For a given exam, walks every concept link and reports what content
 * is missing — the backbone of the credible per-exam admin workflow.
 *
 * Pure function of (exam definition, content bundle, telemetry snapshot).
 * No DB, no network. Called via CLI or admin HTTP endpoint.
 */

import fs from 'fs';
import path from 'path';
import { ALL_CONCEPTS } from '../constants/concept-graph';
import { getExam } from './exam-loader';
import type { ContentGap, ExamDefinition } from './types';

// ============================================================================
// Bundle loader (one-shot cache)
// ============================================================================

interface BundleProblem {
  id: string;
  concept_id?: string;
  topic?: string;
  wolfram_verified?: boolean;
}
interface BundleExplainer {
  canonical_definition?: string;
  deep_explanation?: string;
  worked_examples?: any[];
  common_misconceptions?: string[];
}
interface Bundle {
  problems: BundleProblem[];
  explainers: Record<string, BundleExplainer>;
}

let _bundle: Bundle | null = null;
function loadBundle(): Bundle {
  if (_bundle) return _bundle;
  const bundlePath = path.resolve(process.cwd(), 'frontend/public/data/content-bundle.json');
  try {
    const raw = JSON.parse(fs.readFileSync(bundlePath, 'utf-8'));
    _bundle = {
      problems: Array.isArray(raw.problems) ? raw.problems : [],
      explainers: raw.explainers || {},
    };
  } catch {
    _bundle = { problems: [], explainers: {} };
  }
  return _bundle;
}

// ============================================================================
// Constants — what "complete" means per concept
// ============================================================================

const TARGET_PRACTICE_PROBLEMS = 3;
const TARGET_WOLFRAM_VERIFIED = 2;

// ============================================================================
// Core: analyze one concept × exam pair
// ============================================================================

function analyzeConceptGap(concept_id: string, exam: ExamDefinition): ContentGap | null {
  const bundle = loadBundle();
  const exp = bundle.explainers[concept_id];

  const conceptNode = ALL_CONCEPTS.find(c => c.id === concept_id);
  if (!conceptNode) return null;

  const link = exam.concept_links.find(l => l.concept_id === concept_id);
  const weight = link?.weight ?? 0.01;

  const missing = {
    explainer_body: !exp || (!exp.canonical_definition && !exp.deep_explanation),
    worked_examples: !exp?.worked_examples || exp.worked_examples.length === 0,
    misconceptions: !exp?.common_misconceptions || exp.common_misconceptions.length === 0,
    practice_problems_have: bundle.problems.filter(p => p.concept_id === concept_id).length,
    practice_problems_target: TARGET_PRACTICE_PROBLEMS,
    wolfram_verified_have: bundle.problems.filter(p => p.concept_id === concept_id && p.wolfram_verified).length,
    wolfram_verified_target: TARGET_WOLFRAM_VERIFIED,
  };

  // Compute emptiness fraction (0..1) — 1 means completely empty
  const emptiness =
    (missing.explainer_body ? 1 : 0) * 0.30 +
    (missing.worked_examples ? 1 : 0) * 0.20 +
    (missing.misconceptions ? 1 : 0) * 0.20 +
    Math.max(0, 1 - missing.practice_problems_have / missing.practice_problems_target) * 0.20 +
    Math.max(0, 1 - missing.wolfram_verified_have / missing.wolfram_verified_target) * 0.10;

  // No gaps at all — skip
  if (emptiness < 0.01) return null;

  // Priority: exam weight × emptiness
  // We scale by 100 so the numbers are human-readable (0..100+ scale)
  const priority = Math.round(weight * emptiness * 100 * 10) / 10;

  return {
    concept_id,
    concept_label: conceptNode.label,
    topic: conceptNode.topic,
    exam_id: exam.metadata.id,
    exam_weight: weight,
    missing,
    priority,
  };
}

// ============================================================================
// Per-exam gap analysis
// ============================================================================

export function analyzeExamGaps(exam_id: string): {
  exam_id: string;
  exam_name: string;
  total_concepts: number;
  gaps: ContentGap[];
  summary: {
    complete: number;
    partial: number;
    empty: number;
  };
} | null {
  const exam = getExam(exam_id);
  if (!exam) return null;

  const gaps: ContentGap[] = [];
  let complete = 0, partial = 0, empty = 0;

  for (const link of exam.concept_links) {
    const gap = analyzeConceptGap(link.concept_id, exam);
    if (!gap) {
      complete++;
      continue;
    }
    // Classify
    if (gap.missing.explainer_body && gap.missing.practice_problems_have === 0) {
      empty++;
    } else {
      partial++;
    }
    gaps.push(gap);
  }

  // Sort by priority desc
  gaps.sort((a, b) => b.priority - a.priority);

  return {
    exam_id,
    exam_name: exam.metadata.name,
    total_concepts: exam.concept_links.length,
    gaps,
    summary: { complete, partial, empty },
  };
}

// ============================================================================
// Cross-exam gap rollup
// ============================================================================

/**
 * Same gap across multiple exams (e.g. "eigenvalues misconceptions missing"
 * affects GATE, JEE, CSIR-NET) gets boosted priority — fixing one helps many.
 */
export interface CrossExamGap {
  concept_id: string;
  concept_label: string;
  affected_exams: string[];
  combined_priority: number;
  summary_missing: string[];
}

export function rollUpGapsAcrossExams(exam_ids: string[]): CrossExamGap[] {
  const perConcept = new Map<string, {
    exams: Set<string>;
    priority_sum: number;
    missing_flags: Set<string>;
    concept_label: string;
  }>();

  for (const exam_id of exam_ids) {
    const analysis = analyzeExamGaps(exam_id);
    if (!analysis) continue;
    for (const gap of analysis.gaps) {
      let e = perConcept.get(gap.concept_id);
      if (!e) {
        e = {
          exams: new Set(),
          priority_sum: 0,
          missing_flags: new Set(),
          concept_label: gap.concept_label,
        };
        perConcept.set(gap.concept_id, e);
      }
      e.exams.add(exam_id);
      e.priority_sum += gap.priority;
      if (gap.missing.explainer_body) e.missing_flags.add('explainer');
      if (gap.missing.worked_examples) e.missing_flags.add('worked-examples');
      if (gap.missing.misconceptions) e.missing_flags.add('misconceptions');
      if (gap.missing.practice_problems_have < gap.missing.practice_problems_target) {
        e.missing_flags.add('practice-problems');
      }
      if (gap.missing.wolfram_verified_have < gap.missing.wolfram_verified_target) {
        e.missing_flags.add('wolfram-verify');
      }
    }
  }

  const out: CrossExamGap[] = [];
  for (const [concept_id, e] of perConcept) {
    out.push({
      concept_id,
      concept_label: e.concept_label,
      affected_exams: [...e.exams].sort(),
      // Boost concepts that affect multiple exams — fixing once pays many times
      combined_priority: Math.round(e.priority_sum * Math.sqrt(e.exams.size) * 10) / 10,
      summary_missing: [...e.missing_flags].sort(),
    });
  }
  out.sort((a, b) => b.combined_priority - a.combined_priority);
  return out;
}
