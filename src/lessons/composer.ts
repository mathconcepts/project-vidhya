// @ts-nocheck
/**
 * Composer
 *
 * Given a SourceBundle, assemble the base Lesson. This is a PURE function
 * (given the same sources, returns the same lesson). No LLM calls, no
 * network. Every component is attempted; missing sources produce absent
 * components, not crashes.
 *
 * Source priority for each component (highest to lowest):
 *   USER-MATERIALS > BUNDLE-CANON > WOLFRAM > CONCEPT-GRAPH
 *
 * The resulting Lesson is deterministic and cacheable. Personalization
 * happens in a separate pass (src/lessons/personalizer.ts).
 */

import crypto from 'crypto';
import type {
  Lesson,
  LessonComponent,
  HookComponent,
  DefinitionComponent,
  IntuitionComponent,
  WorkedExampleComponent,
  MicroExerciseComponent,
  CommonTrapsComponent,
  FormalStatementComponent,
  ConnectionsComponent,
  WorkedStep,
  TrapEntry,
  Attribution,
} from './types';
import type { SourceBundle, UserMaterialChunk } from './source-resolver';
import {
  userMaterialAttribution,
  bundleAttribution,
  wolframAttribution,
  graphAttribution,
} from './source-resolver';
import { COMPONENT_ORDER } from './types';

// ============================================================================
// Deterministic component ID helper
// ============================================================================

function componentId(concept_id: string, kind: string): string {
  const h = crypto.createHash('sha256').update(`${concept_id}|${kind}`).digest('hex').slice(0, 10);
  return `${kind}-${h}`;
}

// ============================================================================
// Helper: best user-material chunk for a topic
// ============================================================================

function findMatchingUserChunk(
  chunks: UserMaterialChunk[],
  keyword_hints: string[],
): UserMaterialChunk | null {
  if (!chunks || chunks.length === 0) return null;
  // Prefer chunks that mention any of the keyword hints
  const lower_hints = keyword_hints.map(k => k.toLowerCase());
  const scored = chunks.map(c => {
    const t = c.chunk_text.toLowerCase();
    const hitScore = lower_hints.reduce((s, h) => s + (t.includes(h) ? 1 : 0), 0);
    return { chunk: c, hit: hitScore, sim: c.similarity };
  });
  scored.sort((a, b) => (b.hit - a.hit) || (b.sim - a.sim));
  return scored[0]?.chunk || null;
}

// ============================================================================
// Component builders — one per kind
// ============================================================================

function buildHook(sources: SourceBundle): HookComponent | null {
  const { graph, bundle, user_materials } = sources;
  const userChunk = findMatchingUserChunk(user_materials, [graph.label, 'important', 'used in', 'applied']);
  if (userChunk) {
    const trimmed = userChunk.chunk_text.slice(0, 400).trim();
    return {
      kind: 'hook',
      id: componentId(sources.concept_id, 'hook'),
      text: `From your notes: ${trimmed}${trimmed.length < userChunk.chunk_text.length ? '…' : ''}`,
      attribution: userMaterialAttribution(userChunk),
    };
  }
  if (bundle.explainer?.exam_tip) {
    return {
      kind: 'hook',
      id: componentId(sources.concept_id, 'hook'),
      text: bundle.explainer.exam_tip,
      attribution: bundleAttribution(undefined, graph.label),
    };
  }
  // Graph-fallback: generate a generic motivational line
  return {
    kind: 'hook',
    id: componentId(sources.concept_id, 'hook'),
    text: `${graph.label} matters because it shows up across ${graph.dependents.length} downstream concepts and is a workhorse in ${graph.topic.replace(/-/g, ' ')}.`,
    attribution: graphAttribution(),
  };
}

function buildDefinition(sources: SourceBundle): DefinitionComponent {
  const { graph, bundle } = sources;
  if (bundle.explainer?.canonical_definition) {
    return {
      kind: 'definition',
      id: componentId(sources.concept_id, 'definition'),
      canonical: bundle.explainer.canonical_definition,
      plain_english: graph.description,
      attribution: bundleAttribution(undefined, graph.label),
    };
  }
  return {
    kind: 'definition',
    id: componentId(sources.concept_id, 'definition'),
    canonical: graph.description,
    plain_english: graph.description,
    attribution: graphAttribution(),
  };
}

function buildIntuition(sources: SourceBundle): IntuitionComponent | null {
  const { graph, bundle, user_materials } = sources;
  const userChunk = findMatchingUserChunk(user_materials, ['imagine', 'geometric', 'intuition', 'picture']);
  if (userChunk) {
    return {
      kind: 'intuition',
      id: componentId(sources.concept_id, 'intuition'),
      text: userChunk.chunk_text.slice(0, 500).trim(),
      attribution: userMaterialAttribution(userChunk),
    };
  }
  if (bundle.explainer?.deep_explanation) {
    return {
      kind: 'intuition',
      id: componentId(sources.concept_id, 'intuition'),
      text: bundle.explainer.deep_explanation,
      attribution: bundleAttribution(undefined, graph.label),
    };
  }
  // No rich source — skip intuition rather than fabricate
  return null;
}

function buildWorkedExample(sources: SourceBundle): WorkedExampleComponent | null {
  const { bundle, graph } = sources;
  const p = bundle.problems[0];
  if (p) {
    const explanationLines = (p.explanation || '').split(/\n|\. /).filter(s => s.trim().length > 0).slice(0, 6);
    const steps: WorkedStep[] = explanationLines.length > 0
      ? explanationLines.map((line, i) => ({
          step_number: i + 1,
          action: line.trim().replace(/^\d+[.)]\s*/, ''),
          explanation: line.trim(),
        }))
      : [{
          step_number: 1,
          action: 'Apply the standard procedure for this type of problem.',
          explanation: 'See canonical technique for this concept.',
        }];
    // Attach a self-check prompt to the last step — encourages elaborative interrogation
    if (steps.length > 0) {
      steps[steps.length - 1].self_check_prompt = 'What would change in this solution if the numbers were swapped or a constant added?';
    }
    return {
      kind: 'worked_example',
      id: componentId(sources.concept_id, 'worked_example'),
      problem: p.question_text,
      final_answer: p.correct_answer || '(not provided)',
      steps,
      attribution: bundleAttribution(p.source, graph.label),
      wolfram_verified: !!p.wolfram_verified,
    };
  }
  // Explainer-embedded worked example fallback
  const ex = bundle.explainer?.worked_examples?.[0];
  if (ex) {
    const problem = typeof ex === 'string' ? ex : ex.problem;
    const solution = typeof ex === 'string' ? '' : ex.solution;
    return {
      kind: 'worked_example',
      id: componentId(sources.concept_id, 'worked_example'),
      problem,
      final_answer: '(see explanation)',
      steps: [{
        step_number: 1,
        action: solution || 'Apply the core technique.',
        explanation: solution || 'See canonical worked solution.',
      }],
      attribution: bundleAttribution(undefined, graph.label),
    };
  }
  return null;
}

function buildMicroExercise(sources: SourceBundle): MicroExerciseComponent | null {
  const { bundle } = sources;
  // Use second bundle problem (different from the worked example) for retrieval practice
  const p = bundle.problems[1] || bundle.problems[0];
  if (!p) return null;
  return {
    kind: 'micro_exercise',
    id: componentId(sources.concept_id, 'micro_exercise'),
    question: p.question_text,
    expected_answer: p.correct_answer || '(check with solution)',
    answer_explanation: p.explanation || 'Apply the technique from the worked example.',
    difficulty: p.difficulty ?? 0.4,
    attribution: bundleAttribution(p.source),
    wolfram_verified: !!p.wolfram_verified,
  };
}

function buildCommonTraps(sources: SourceBundle): CommonTrapsComponent | null {
  const { bundle } = sources;
  const raw = bundle.explainer?.common_misconceptions;
  if (!raw || raw.length === 0) return null;
  const traps: TrapEntry[] = raw.slice(0, 4).map(m => {
    // If the misconception is a full sentence with "because", split it
    const match = typeof m === 'string'
      ? m.match(/^(.*?)\s*(?:because|since|as)\s+(.*)$/i)
      : null;
    if (match) {
      return {
        description: match[1].trim(),
        why_it_happens: match[2].trim(),
      };
    }
    return {
      description: typeof m === 'string' ? m : String(m),
      why_it_happens: 'A common point of confusion.',
    };
  });
  return {
    kind: 'common_traps',
    id: componentId(sources.concept_id, 'common_traps'),
    traps,
    attribution: bundleAttribution(undefined, sources.graph.label),
  };
}

function buildFormalStatement(sources: SourceBundle): FormalStatementComponent | null {
  const { bundle, graph } = sources;
  // Use the canonical definition as the formal statement if available.
  // We don't attempt LaTeX conversion here — the canonical definition
  // is expected to be LaTeX-friendly already for math content.
  if (bundle.explainer?.canonical_definition) {
    return {
      kind: 'formal_statement',
      id: componentId(sources.concept_id, 'formal_statement'),
      statement: bundle.explainer.canonical_definition,
      latex: bundle.explainer.canonical_definition, // consumer may render with KaTeX
      attribution: bundleAttribution(undefined, graph.label),
    };
  }
  return null;
}

function buildConnections(sources: SourceBundle): ConnectionsComponent {
  const { graph } = sources;
  return {
    kind: 'connections',
    id: componentId(sources.concept_id, 'connections'),
    prerequisites: graph.prerequisites.map(p => ({
      concept_id: p.id,
      label: p.label,
      relationship: 'requires',
    })),
    leads_to: graph.dependents.map(d => ({
      concept_id: d.id,
      label: d.label,
      relationship: 'unlocks',
    })),
    attribution: graphAttribution(),
  };
}

// ============================================================================
// Quality scoring
// ============================================================================

function computeQualityScore(components: LessonComponent[]): number {
  // Fraction of the 8 possible components that are present
  return Math.round((components.length / COMPONENT_ORDER.length) * 100) / 100;
}

function computeEstimatedMinutes(components: LessonComponent[], difficulty: number): number {
  // Rough per-component reading/engagement time budgets
  const baseMinutesByKind: Record<string, number> = {
    hook: 1,
    definition: 1,
    intuition: 2,
    worked_example: 3,
    micro_exercise: 1,
    common_traps: 1,
    formal_statement: 1,
    connections: 1,
  };
  const sum = components.reduce((s, c) => s + (baseMinutesByKind[c.kind] ?? 1), 0);
  return Math.round(sum * (0.85 + difficulty * 0.3)); // harder concepts take longer
}

// ============================================================================
// Main composer
// ============================================================================

export function composeBase(sources: SourceBundle): Lesson {
  const components: LessonComponent[] = [];
  const pushed: Record<string, boolean> = {};

  // Build in canonical order so the sequence is pedagogically sound.
  // Each builder may return null; we simply skip those components.
  const builders: Array<() => LessonComponent | null> = [
    () => buildHook(sources),
    () => buildDefinition(sources),
    () => buildIntuition(sources),
    () => buildWorkedExample(sources),
    () => buildMicroExercise(sources),
    () => buildCommonTraps(sources),
    () => buildFormalStatement(sources),
    () => buildConnections(sources),
  ];

  for (const build of builders) {
    const c = build();
    if (c && !pushed[c.kind]) {
      components.push(c);
      pushed[c.kind] = true;
    }
  }

  // Collect unique sources for the lesson-level attribution list
  const seenSources = new Set<string>();
  const sourcesList: Attribution[] = [];
  for (const c of components) {
    const a = (c as any).attribution as Attribution | undefined;
    if (!a) continue;
    const key = `${a.kind}|${a.title || ''}|${a.license || ''}`;
    if (!seenSources.has(key)) {
      seenSources.add(key);
      sourcesList.push(a);
    }
  }

  const quality_score = computeQualityScore(components);
  const estimated_minutes = computeEstimatedMinutes(components, sources.graph.difficulty_base);

  return {
    concept_id: sources.concept_id,
    concept_label: sources.graph.label,
    topic: sources.graph.topic,
    components,
    estimated_minutes,
    difficulty_base: sources.graph.difficulty_base,
    quality_score,
    sources: sourcesList,
    personalization_applied: [],
    is_revisit: false,
    generated_at: new Date().toISOString(),
  };
}
