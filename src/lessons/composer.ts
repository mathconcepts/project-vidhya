/**
 * Composer
 *
 * Given a SourceBundle, assemble the base Lesson. This is a PURE function
 * (given the same sources, returns the same lesson). No LLM calls, no
 * network. Every component is attempted; missing sources produce absent
 * components, not crashes.
 *
 * Source priority for each component (highest to lowest):
 *   USER-MATERIALS > BUNDLE-CANON > TOPIC-NOTES > WOLFRAM > CONCEPT-GRAPH
 *
 * Honesty rules (locked by the content-pipeline realignment plan):
 *   - Never split MCQ explanations into fake numbered "steps". An MCQ
 *     without a real worked solution renders as an 'example_problem' card.
 *   - Never serve placeholder explainer prose as intuition; use the
 *     authored topic study guide instead, clearly attributed.
 *   - Never duplicate the canonical definition as a "formal statement".
 *
 * The resulting Lesson is deterministic and cacheable. Personalization
 * happens in a separate pass (src/lessons/personalizer.ts).
 *
 * One deliberate exception to "no I/O": the worked-example builder reads
 * the LOCAL wolfram-steps disk cache (.data/wolfram-steps/, written by
 * the wolfram-verify background job) and, when a cached entry exists for
 * the example problem, attaches a provenance-labeled step-by-step
 * enrichment. Still no network, still deterministic for a given cache
 * state, and graceful when the cache dir is missing.
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
  StrategyComponent,
  FormalStatementComponent,
  ConnectionsComponent,
  TrapEntry,
  Attribution,
} from './types';
import type { SourceBundle, UserMaterialChunk } from './source-resolver';
import {
  userMaterialAttribution,
  bundleAttribution,
  graphAttribution,
  topicNotesAttribution,
  wolframAttribution,
} from './source-resolver';
import { readWolframSteps } from '../services/wolfram-steps-cache';
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
  // A REAL explainer (not the placeholder stub) wins next.
  const isPlaceholder = bundle.explainer?.model === 'placeholder';
  if (bundle.explainer?.deep_explanation && !isPlaceholder) {
    return {
      kind: 'intuition',
      id: componentId(sources.concept_id, 'intuition'),
      text: bundle.explainer.deep_explanation,
      attribution: bundleAttribution(undefined, graph.label),
    };
  }
  // Topic-notes fallback: authored per-topic "mental model" prose (or the
  // concept's own section when the study guide has one). Honest label —
  // the concept-specific explainer is still expanding.
  const notes = sources.topic_notes;
  const topicText = notes?.concept_section ?? notes?.mental_model ?? null;
  if (notes && topicText) {
    return {
      kind: 'intuition',
      id: componentId(sources.concept_id, 'intuition'),
      text:
        `${topicText.trim()}\n\n` +
        `_From the ${notes.topic_id.replace(/-/g, ' ')} study guide — ` +
        `a concept-specific explainer for ${graph.label} is still expanding._`,
      attribution: topicNotesAttribution(notes.topic_id),
    };
  }
  // No rich source — skip intuition rather than fabricate
  return null;
}

function buildStrategy(sources: SourceBundle): StrategyComponent | null {
  const notes = sources.topic_notes;
  const strategy = notes?.study_strategy?.trim();
  if (!notes || !strategy) return null;
  return {
    kind: 'strategy',
    id: componentId(sources.concept_id, 'strategy'),
    text: strategy,
    attribution: topicNotesAttribution(notes.topic_id),
  };
}

function buildWorkedExample(sources: SourceBundle): WorkedExampleComponent | null {
  const { bundle, graph } = sources;
  // 1. A REAL worked example (explainer-authored/generated) wins. Its
  //    solution renders as one authored solution block — we don't invent
  //    step boundaries the author didn't write.
  const ex = bundle.explainer?.worked_examples?.[0];
  if (ex) {
    const problem = typeof ex === 'string' ? ex : ex.problem;
    const solution = typeof ex === 'string' ? '' : ex.solution;
    const answer = typeof ex === 'string' ? undefined : ex.answer;
    if (problem && problem.trim()) {
      return {
        kind: 'worked_example',
        id: componentId(sources.concept_id, 'worked_example'),
        problem,
        final_answer: answer || '(see solution)',
        steps: [{
          step_number: 1,
          action: 'Worked solution',
          explanation: solution || '(solution not provided)',
          self_check_prompt: 'What would change in this solution if the numbers were swapped or a constant added?',
        }],
        attribution: bundleAttribution(undefined, graph.label),
      };
    }
  }
  // 2. Otherwise render an MCQ from the bundle HONESTLY: a single
  //    "example problem" card — question, options, answer, explanation as
  //    one prose block. Never split the explanation into fake numbered
  //    "steps" (the old behavior manufactured step structure from
  //    sentence boundaries).
  const p = bundle.problems[0];
  if (p) {
    const component: WorkedExampleComponent = {
      kind: 'worked_example',
      id: componentId(sources.concept_id, 'worked_example'),
      presentation: 'example_problem',
      problem: p.question_text,
      options: Array.isArray(p.options) ? p.options : undefined,
      final_answer: p.correct_answer || '(not provided)',
      explanation: (p.explanation || '').trim() || undefined,
      steps: [],
      attribution: bundleAttribution(p.source, graph.label),
      wolfram_verified: !!p.wolfram_verified,
    };
    // Wolfram step harvest (realignment plan item 5): when the
    // wolfram-verify job has cached real step-by-step output for THIS
    // example problem, attach it as a provenance-labeled enrichment.
    // Never fabricated — either Wolfram computed the steps or the field
    // is absent. Graceful when the cache dir is missing (reader → null).
    const cached = p.id ? readWolframSteps(p.id) : null;
    if (cached) {
      component.wolfram_steps = {
        steps: cached.steps,
        provenance: cached.provenance,
        attribution: wolframAttribution(),
      };
    }
    return component;
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
    // Generated explainers emit {id, description, corrective} objects.
    if (typeof m !== 'string') {
      return {
        description: m.description ?? m.id ?? 'A common point of confusion.',
        why_it_happens: 'A common point of confusion.',
        correction: m.corrective,
      };
    }
    // If the misconception is a full sentence with "because", split it
    const match = m.match(/^(.*?)\s*(?:because|since|as)\s+(.*)$/i);
    if (match) {
      return {
        description: match[1].trim(),
        why_it_happens: match[2].trim(),
      };
    }
    return {
      description: m,
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
  // A formal-statement card exists only when a DISTINCT formal statement
  // is authored. The old behavior copied canonical_definition verbatim,
  // which duplicated the definition card and read as padding.
  const formal = bundle.explainer?.formal_statement?.trim();
  const canonical = bundle.explainer?.canonical_definition?.trim();
  if (formal && formal !== canonical) {
    return {
      kind: 'formal_statement',
      id: componentId(sources.concept_id, 'formal_statement'),
      statement: formal,
      latex: formal, // consumer may render with KaTeX
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
  // Fraction of the possible components (COMPONENT_ORDER) that are present
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
    strategy: 1,
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
    () => buildStrategy(sources),
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
    const attributions: Array<Attribution | undefined> = [(c as any).attribution];
    // Wolfram step enrichment carries its own attribution — surface it
    // in the lesson-level sources list too.
    if (c.kind === 'worked_example' && c.wolfram_steps) {
      attributions.push(c.wolfram_steps.attribution);
    }
    for (const a of attributions) {
      if (!a) continue;
      const key = `${a.kind}|${a.title || ''}|${a.license || ''}`;
      if (!seenSources.has(key)) {
        seenSources.add(key);
        sourcesList.push(a);
      }
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
