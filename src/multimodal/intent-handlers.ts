// @ts-nocheck
/**
 * Intent Handlers — Response Dispatcher
 *
 * Given an IntentAnalysis, produce the MultimodalResponse payload appropriate
 * to the detected intent. Each handler is isolated so adding new intents is
 * a small, local change.
 *
 * Cost discipline: handlers reuse the existing four-tier content resolver and
 * the Wolfram service. No fresh LLM calls unless the resolver explicitly
 * escalates to tier 2. This keeps the cost for typical "explain this image"
 * flows at ~$0.0003 (just the intent analyzer call) + bundle lookup.
 */

import { resolveContent } from '../content/resolver';
import { verifyProblemWithWolfram } from '../services/wolfram-service';
import { generateObjectivesForConcept, pickHintsForConcept } from '../syllabus/scope-templates';
import { ALL_CONCEPTS } from '../constants/concept-graph';
import type { IntentAnalysis, MultimodalRequest, MultimodalResponse } from './types';

// ============================================================================
// Helpers
// ============================================================================

function conceptNode(id: string) {
  return ALL_CONCEPTS.find(c => c.id === id);
}

function primaryConceptId(analysis: IntentAnalysis): string | null {
  return analysis.detected_concepts[0] || null;
}

function scopeFor(req: MultimodalRequest): string {
  return req.scope || 'mcq-rigorous';
}

// ============================================================================
// Handler: concept_question  (explain the concept)
// ============================================================================

async function handleExplain(analysis: IntentAnalysis, req: MultimodalRequest): Promise<Partial<MultimodalResponse>> {
  const conceptId = primaryConceptId(analysis);
  if (!conceptId) {
    return {
      explanation: {
        summary: analysis.summary,
        steps: [],
        key_concepts: [],
      },
    };
  }

  // Tier-0 explainer from bundle
  const explainerResolve = await resolveContent({
    intent: 'explain',
    concept_id: conceptId,
    max_tier: 0,
  });

  if (explainerResolve.source === 'tier-0-explainer' && explainerResolve.explainer) {
    const exp = explainerResolve.explainer;
    return {
      explanation: {
        summary: exp.canonical_definition || analysis.summary,
        steps: exp.deep_explanation ? [exp.deep_explanation] : [],
        key_concepts: [conceptId, ...analysis.detected_concepts.slice(1, 3)],
        example: exp.worked_examples && exp.worked_examples[0]
          ? typeof exp.worked_examples[0] === 'string'
              ? exp.worked_examples[0]
              : JSON.stringify(exp.worked_examples[0])
          : undefined,
      },
      strategy_hints: exp.exam_tip ? [exp.exam_tip] : [],
    };
  }

  // Fallback: use the concept-graph description
  const node = conceptNode(conceptId);
  return {
    explanation: {
      summary: node?.description || analysis.summary,
      steps: [],
      key_concepts: [conceptId, ...analysis.detected_concepts.slice(1, 3)],
    },
  };
}

// ============================================================================
// Handler: practice_request  (give me similar problems)
// ============================================================================

async function handlePractice(analysis: IntentAnalysis, req: MultimodalRequest): Promise<Partial<MultimodalResponse>> {
  const conceptId = primaryConceptId(analysis);
  if (!conceptId) return { practice_problems: [] };

  const problems: MultimodalResponse['practice_problems'] = [];
  const wanted = 3;

  // Pull up to 3 problems at varying difficulty buckets around the detected difficulty
  const difficulties = [
    analysis.estimated_difficulty,
    Math.max(0.25, analysis.estimated_difficulty - 0.2),
    Math.min(0.9, analysis.estimated_difficulty + 0.2),
  ];

  const seen = new Set<string>();
  for (const diff of difficulties) {
    if (problems!.length >= wanted) break;
    const r = await resolveContent({
      intent: 'practice',
      concept_id: conceptId,
      difficulty: diff,
      topic: analysis.detected_topic || undefined,
      max_tier: 0,
    });
    if (r.problem && !seen.has(r.problem.id)) {
      seen.add(r.problem.id);
      problems!.push({
        id: r.problem.id,
        concept_id: r.problem.concept_id || conceptId,
        topic: r.problem.topic || analysis.detected_topic || '',
        difficulty: r.problem.difficulty ?? diff,
        question_text: r.problem.question_text,
        correct_answer: r.problem.correct_answer,
        source: r.source,
        wolfram_verified: !!r.wolfram_verified,
      });
    }
  }

  return { practice_problems: problems };
}

// ============================================================================
// Handler: solve_problem  (solve the problem in the image)
// ============================================================================

async function handleSolve(analysis: IntentAnalysis, req: MultimodalRequest): Promise<Partial<MultimodalResponse>> {
  if (!analysis.extracted_problem_text) {
    return {
      explanation: {
        summary: 'I could not clearly extract a problem statement from this image.',
        steps: ['Try retaking the photo with better lighting, or type the problem out.'],
        key_concepts: [],
      },
    };
  }

  // If the image contains a student answer, verify it; otherwise, check bundle for a cached solve
  const conceptId = primaryConceptId(analysis);
  if (conceptId) {
    const r = await resolveContent({
      intent: 'practice',
      concept_id: conceptId,
      difficulty: analysis.estimated_difficulty,
      max_tier: 0,
    });
    if (r.problem) {
      // Found a bundle entry for this concept — use its solution as reference
      return {
        solution: {
          final_answer: r.problem.correct_answer || 'See steps',
          steps: r.problem.solution_steps || [r.problem.explanation || 'Apply standard procedure.'],
          verification_method: r.wolfram_verified ? 'wolfram' : 'bundle-match',
        },
      };
    }
  }

  // If we have a student answer, Wolfram-verify the extracted problem
  if (analysis.extracted_student_answer) {
    const verify = await verifyProblemWithWolfram(
      analysis.extracted_problem_text,
      analysis.extracted_student_answer,
    );
    return {
      solution: {
        final_answer: verify.wolfram_answer || analysis.extracted_student_answer,
        steps: [
          verify.verified
            ? 'Your answer agrees with the computed result.'
            : `Your answer: ${analysis.extracted_student_answer}. Computed: ${verify.wolfram_answer || 'unavailable'}`,
        ],
        verification_method: verify.verified ? 'wolfram' : 'none',
      },
    };
  }

  // No cached solution and no student answer — return the problem with a hint
  return {
    solution: {
      final_answer: '',
      steps: ['Extracted problem: ' + analysis.extracted_problem_text.slice(0, 300)],
      verification_method: 'none',
    },
  };
}

// ============================================================================
// Handler: solution_check  (verify student's work)
// ============================================================================

async function handleCheck(analysis: IntentAnalysis, req: MultimodalRequest): Promise<Partial<MultimodalResponse>> {
  if (!analysis.extracted_problem_text || !analysis.extracted_student_answer) {
    return {
      explanation: {
        summary: 'I need to see both the problem AND your final answer to check your work.',
        steps: [
          'Make sure your photo shows the problem statement.',
          'Make sure your handwritten answer or final value is visible.',
        ],
        key_concepts: [],
      },
    };
  }

  const verify = await verifyProblemWithWolfram(
    analysis.extracted_problem_text,
    analysis.extracted_student_answer,
  );

  const steps: string[] = [];
  if (verify.verified) {
    steps.push(`Your answer "${analysis.extracted_student_answer}" is correct.`);
    if (analysis.detected_concepts.length > 0) {
      steps.push(`You applied ${analysis.detected_concepts.join(', ')} correctly.`);
    }
  } else if (verify.wolfram_answer) {
    steps.push(`Your answer: ${analysis.extracted_student_answer}`);
    steps.push(`Computed answer: ${verify.wolfram_answer}`);
    if (analysis.detected_error_type) {
      steps.push(`Likely error type: ${analysis.detected_error_type}`);
    }
    if (analysis.detected_misconception) {
      steps.push(`Watch for: ${analysis.detected_misconception}`);
    }
  } else {
    steps.push('I could not computationally verify this answer. Let me know if you want me to walk through the problem step by step.');
  }

  return {
    solution: {
      final_answer: verify.wolfram_answer || analysis.extracted_student_answer,
      steps,
      verification_method: verify.verified ? 'wolfram' : (verify.wolfram_answer ? 'wolfram' : 'none'),
    },
  };
}

// ============================================================================
// Handler: expressing_confusion  (walkthrough)
// ============================================================================

async function handleConfusion(analysis: IntentAnalysis, req: MultimodalRequest): Promise<Partial<MultimodalResponse>> {
  // Combine explain + solve: surface the concept overview and any bundled solution
  const explain = await handleExplain(analysis, req);
  const solve = await handleSolve(analysis, req);

  return {
    ...explain,
    ...solve,
    strategy_hints: [
      'Start by identifying what the problem is asking for.',
      'Write down what you know from the problem statement.',
      'Match it to a known pattern — which theorem or formula applies?',
      ...(explain.strategy_hints || []),
    ],
  };
}

// ============================================================================
// Handler: extract_text  (OCR mode)
// ============================================================================

function handleOCR(analysis: IntentAnalysis): Partial<MultimodalResponse> {
  return {
    ocr: {
      text: analysis.extracted_problem_text || analysis.summary,
      latex: analysis.extracted_problem_text || '',
    },
  };
}

// ============================================================================
// Dispatcher
// ============================================================================

export async function dispatchByIntent(
  analysis: IntentAnalysis,
  req: MultimodalRequest,
): Promise<Partial<MultimodalResponse>> {
  const scope = scopeFor(req);
  const conceptId = primaryConceptId(analysis);
  const node = conceptId ? conceptNode(conceptId) : null;

  // Always compute scope-aware strategy hints as a shared enhancement
  const strategyHints = node
    ? pickHintsForConcept(node, scope as any).map(h => h.advice)
    : [];

  let handlerResult: Partial<MultimodalResponse>;

  switch (analysis.intent) {
    case 'concept_question':
      handlerResult = await handleExplain(analysis, req);
      break;
    case 'practice_request':
      handlerResult = await handlePractice(analysis, req);
      break;
    case 'solve_problem':
      handlerResult = await handleSolve(analysis, req);
      break;
    case 'solution_check':
      handlerResult = await handleCheck(analysis, req);
      break;
    case 'expressing_confusion':
      handlerResult = await handleConfusion(analysis, req);
      break;
    case 'extract_text':
      handlerResult = handleOCR(analysis);
      break;
    default:
      handlerResult = await handleExplain(analysis, req);
  }

  // Fold in strategy hints from the syllabus scope templates
  const mergedHints = [
    ...(handlerResult.strategy_hints || []),
    ...strategyHints,
  ].slice(0, 3);

  return {
    ...handlerResult,
    strategy_hints: mergedHints.length > 0 ? mergedHints : undefined,
  };
}
