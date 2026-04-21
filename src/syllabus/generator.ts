// @ts-nocheck
/**
 * Syllabus Generator
 *
 * Combines five inputs to produce a personalized learning plan:
 *
 *   1. Exam definition (topics, weights, scope constraints)  — exam-catalog.ts
 *   2. Exam scope (learning-objective taxonomy)               — scope-templates.ts
 *   3. Source catalog (attributed reading material)           — source-catalog.ts
 *   4. Concept graph (prerequisite DAG, frequencies)          — src/constants/concept-graph.ts
 *   5. Student model from GBrain (mastery, ZPD, weak spots)   — passed in
 *
 * Output: a Syllabus object with ordered nodes, each carrying learning
 * objectives, sources, strategy hints, and a scheduled day.
 *
 * The generator does NOT talk to the LLM — it's pure functional computation
 * over the graph + student state. That keeps it cheap and deterministic.
 */

import crypto from 'crypto';
import { ALL_CONCEPTS } from '../constants/concept-graph';
import type { ConceptNode } from '../constants/concept-graph';
import { getExam } from './exam-catalog';
import { generateObjectivesForConcept, pickHintsForConcept } from './scope-templates';
import { getSourcesForConcept } from './source-catalog';
import type { Syllabus, SyllabusNode, SyllabusRequest, ExamScope } from './types';

// ============================================================================
// Student snapshot (duck-typed to avoid cross-module coupling)
// ============================================================================

/**
 * Minimal student-model shape the generator needs. Accepts both the server
 * StudentModel and the client-side mirror.
 */
export interface StudentSnapshot {
  session_id?: string;
  total_attempts?: number;
  mastery_by_concept?: Record<string, number>;
  mastery_by_topic?: Record<string, number>;
  zpd_concepts?: string[];               // concepts currently in the student's ZPD
  recent_errors?: Array<{ concept_id: string; error_type: string }>;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Rank concepts for inclusion in the syllabus based on four factors:
 *   - exam topic weight
 *   - gate_frequency
 *   - student weakness (low mastery raises priority)
 *   - prerequisite depth (prereqs pulled in automatically)
 */
function rankConcepts(
  concepts: ConceptNode[],
  topicWeights: Record<string, number>,
  student: StudentSnapshot,
): Array<ConceptNode & { score: number; reason: SyllabusNode['inclusion_reason'] }> {
  const freqScore = { high: 1.0, medium: 0.6, low: 0.3, rare: 0.1 };
  const zpdSet = new Set(student.zpd_concepts || []);
  const errorCount: Record<string, number> = {};
  for (const e of student.recent_errors || []) {
    errorCount[e.concept_id] = (errorCount[e.concept_id] || 0) + 1;
  }

  return concepts.map(c => {
    const topicWeight = topicWeights[c.topic] ?? 0.05;
    const freq = freqScore[c.gate_frequency] ?? 0.3;
    const mastery = student.mastery_by_concept?.[c.id] ?? 0;
    const errors = errorCount[c.id] || 0;
    const zpd = zpdSet.has(c.id) ? 0.2 : 0;

    // Low mastery + high weight = high priority. High mastery + high weight = lower.
    const masteryGap = Math.max(0, 0.75 - mastery);           // how far below "proficient"
    const score = (topicWeight * 2.0) + (freq * 1.5) + (masteryGap * 2.0) + (errors * 0.5) + zpd;

    let reason: SyllabusNode['inclusion_reason'] = 'core';
    if (errors >= 2) reason = 'student-weak-spot';
    else if (zpdSet.has(c.id)) reason = 'student-interest';
    else if (c.gate_frequency === 'high') reason = 'frequently-tested';

    return { ...c, score, reason };
  });
}

/**
 * Ensure prerequisites appear before their dependents in the schedule,
 * and auto-include prereqs the student hasn't mastered.
 */
function ensurePrerequisites(
  selected: Array<ConceptNode & { score: number; reason: SyllabusNode['inclusion_reason'] }>,
  student: StudentSnapshot,
): Array<ConceptNode & { score: number; reason: SyllabusNode['inclusion_reason'] }> {
  const byId = new Map(ALL_CONCEPTS.map(c => [c.id, c]));
  const included = new Map(selected.map(c => [c.id, c]));
  const added: typeof selected = [];

  for (const c of selected) {
    for (const prereqId of c.prerequisites || []) {
      if (included.has(prereqId)) continue;
      const prereqMastery = student.mastery_by_concept?.[prereqId] ?? 0;
      if (prereqMastery >= 0.7) continue;  // student knows it well enough
      const prereqNode = byId.get(prereqId);
      if (!prereqNode) continue;
      const withScore = { ...prereqNode, score: c.score * 0.8, reason: 'prerequisite' as const };
      included.set(prereqId, withScore);
      added.push(withScore);
    }
  }

  // Topological-ish sort: prereq before dependent, otherwise by score
  const combined = [...selected, ...added];
  const byIdLocal = new Map(combined.map(c => [c.id, c]));
  const sorted: typeof combined = [];
  const visited = new Set<string>();

  function visit(node: typeof combined[0]) {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    for (const prereqId of node.prerequisites || []) {
      const prereq = byIdLocal.get(prereqId);
      if (prereq) visit(prereq);
    }
    sorted.push(node);
  }

  // Visit in score order (highest first), but topo keeps prereqs earlier
  const byScoreDesc = [...combined].sort((a, b) => b.score - a.score);
  for (const c of byScoreDesc) visit(c);

  return sorted;
}

/**
 * Slice the prioritized list to fit the student's time budget.
 */
function fitToSchedule(
  ranked: ReturnType<typeof ensurePrerequisites>,
  dailyMinutes: number,
  targetDays: number,
  maxConcepts: number,
): ReturnType<typeof ensurePrerequisites> {
  let budget = dailyMinutes * targetDays;
  const result = [];

  for (const c of ranked) {
    if (result.length >= maxConcepts) break;
    const rough = 60 * (1 + c.difficulty_base);  // rough minutes per concept
    if (budget < rough * 0.5 && result.length > 10) break;  // stop when we run out of time
    result.push(c);
    budget -= rough;
  }
  return result;
}

// ============================================================================
// Narrative generation — scope-aware intro/closing strings
// ============================================================================

function generateIntro(scope: ExamScope, examName: string, conceptCount: number, daysEstimate: number): string {
  const base = `This is your personalized study plan for ${examName}. ${conceptCount} concepts across ${daysEstimate} days of preparation. `;
  switch (scope) {
    case 'mcq-fast':
      return base + "Since this is a time-pressured multiple-choice exam, we've front-loaded recognition and shortcut strategies. Build a cheat-sheet as you go — your goal is fast pattern-matching, not deep derivation. Elimination is your best friend.";
    case 'mcq-rigorous':
      return base + "The exam mixes MCQ with numerical-answer-type questions, so you need both recognition speed AND computational accuracy. Master the standard procedures, then practice against the clock.";
    case 'subjective-short':
      return base + "Short-form written answers reward clear reasoning, correct notation, and confident final answers. We've emphasized the apply-and-analyze depths — show your steps, state your theorems, box the answer.";
    case 'subjective-long':
      return base + "Long-form written exams test derivation and proof-style reasoning. Your objectives emphasize analyze, evaluate, and create depths. Treat every problem as a miniature paper: plan the argument before writing.";
    case 'oral-viva':
      return base + "Viva preparation is different: you'll be defending understanding verbally. Objectives prioritize explanation, cross-topic connection, and the ability to answer 'why' — not just 'how'. Practice explaining concepts aloud to yourself.";
    case 'practical':
      return base + "Practical exams evaluate tool fluency and iterative refinement. Spend more time solving problems in software than reading theory. Debug, test edge cases, and document your work.";
    default:
      return base;
  }
}

function generateClosing(scope: ExamScope): string {
  switch (scope) {
    case 'mcq-fast':
      return 'Final week: drill past papers with a timer. Every wrong answer goes on a one-page error log. Skip topics you own; grind the weak spots. On exam day — if stuck, flag and move. Never lose time on a single question.';
    case 'mcq-rigorous':
      return 'Final two weeks: simulate the full exam under timed conditions. Measure both accuracy AND speed. Review incorrect answers with Wolfram to confirm the "right" path. One careful pass beats three rushed ones.';
    case 'subjective-short':
      return 'Final two weeks: practice writing full solutions by hand, in exam-like conditions. Have a peer or tutor grade them. Notation and clarity matter as much as correctness.';
    case 'subjective-long':
      return 'Final three weeks: write out full proofs for the 10 most-likely theorems. Read them back a week later — if the argument is not clear to you cold, it won\'t be clear to the grader. Practice the "state goal → outline strategy → prove → conclude" template.';
    case 'oral-viva':
      return 'Final week: record yourself explaining each topic. Listen back. Notice where you hedge, mumble, or skip. Ask a peer to play examiner and probe with follow-up questions.';
    case 'practical':
      return 'Final week: build a reference kit of working code snippets for every standard procedure. Know where to find them fast. Practice time-boxed problems.';
    default:
      return 'Good luck.';
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate a personalized syllabus.
 *
 * @param req  request with exam_id, scope, optional student context
 * @param student  optional student snapshot for personalization
 */
export function generateSyllabus(
  req: SyllabusRequest,
  student: StudentSnapshot = {},
): Syllabus {
  const exam = getExam(req.exam_id);
  if (!exam) throw new Error(`Unknown exam: ${req.exam_id}`);

  const scope = req.scope || exam.default_scope;
  if (!exam.allowed_scopes.includes(scope)) {
    throw new Error(`Scope '${scope}' not allowed for exam '${exam.id}'. Allowed: ${exam.allowed_scopes.join(', ')}`);
  }

  const dailyMinutes = req.daily_minutes ?? 60;
  const maxConcepts = req.max_concepts ?? 50;

  // Filter concepts to this exam's topics (and any further topic_filter)
  const examTopics = new Set(req.topic_filter?.length ? req.topic_filter : exam.topics);
  const conceptsInScope = ALL_CONCEPTS.filter(c => examTopics.has(c.topic));

  // Rank by scoring function blending exam weights + student state
  const ranked = rankConcepts(conceptsInScope, exam.topic_weights, student);
  ranked.sort((a, b) => b.score - a.score);

  // Target days: if user provided target_date, compute; else use typical_prep_weeks
  let targetDays: number;
  if (req.target_date) {
    const days = Math.ceil((new Date(req.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    targetDays = Math.max(7, days);
  } else {
    targetDays = exam.typical_prep_weeks * 7;
  }

  // Ensure prerequisites are pulled in where student hasn't mastered them
  const withPrereqs = ensurePrerequisites(ranked, student);

  // Fit to the time budget
  const selected = fitToSchedule(withPrereqs, dailyMinutes, targetDays, maxConcepts);

  // Build syllabus nodes
  const nodes: SyllabusNode[] = [];
  let runningDay = 1;
  let runningMinutes = 0;

  for (const c of selected) {
    const objectives = generateObjectivesForConcept(c, scope);
    const sources = getSourcesForConcept(c.id, c.topic, c.label, scope);
    const strategyHints = pickHintsForConcept(c, scope);

    const objectiveMinutes = objectives.reduce((s, o) => s + o.estimated_time_minutes, 0);
    const sourceMinutes = sources.reduce((s, src) => s + src.estimated_time_minutes, 0);
    const totalMinutes = Math.round(objectiveMinutes + sourceMinutes * 0.7); // reading is partially parallelizable

    // Advance scheduled_day when daily cap reached
    if (runningMinutes + totalMinutes > dailyMinutes) {
      runningDay += 1;
      runningMinutes = totalMinutes;
    } else {
      runningMinutes += totalMinutes;
    }

    nodes.push({
      concept_id: c.id,
      concept_label: c.label,
      topic: c.topic,
      gate_frequency: c.gate_frequency,
      difficulty_base: c.difficulty_base,
      inclusion_reason: c.reason,
      objectives,
      sources,
      strategy_hints: strategyHints,
      current_mastery: student.mastery_by_concept?.[c.id] ?? 0,
      zpd_ready: (student.zpd_concepts || []).includes(c.id),
      scheduled_day: runningDay,
      estimated_study_minutes: totalMinutes,
    });
  }

  // Stats
  const totalMinutes = nodes.reduce((s, n) => s + n.estimated_study_minutes, 0);
  const estimatedDays = Math.max(1, Math.ceil(totalMinutes / dailyMinutes));
  const coverageByTopic: Record<string, number> = {};
  const depthDist: Record<string, number> = {};
  for (const n of nodes) {
    coverageByTopic[n.topic] = (coverageByTopic[n.topic] || 0) + 1;
    for (const o of n.objectives) {
      depthDist[o.depth] = (depthDist[o.depth] || 0) + 1;
    }
  }

  // Student summary
  const masteryList = Object.values(student.mastery_by_concept || {});
  const overallMastery = masteryList.length > 0
    ? masteryList.reduce((s, m) => s + m, 0) / masteryList.length
    : 0;
  const topicMastery = student.mastery_by_topic || {};
  const weakTopics = Object.entries(topicMastery).filter(([, m]) => m < 0.5).map(([t]) => t);
  const strongTopics = Object.entries(topicMastery).filter(([, m]) => m >= 0.75).map(([t]) => t);

  const syllabusId = crypto.createHash('sha256')
    .update(`${exam.id}|${scope}|${student.session_id || 'anon'}|${Date.now()}`)
    .digest('hex').slice(0, 16);

  return {
    id: syllabusId,
    generated_at: new Date().toISOString(),
    exam_id: exam.id,
    exam_name: exam.name,
    scope,
    target_date: req.target_date ?? null,
    daily_minutes: dailyMinutes,
    session_id: student.session_id ?? 'anon',
    student_snapshot: {
      total_attempts: student.total_attempts ?? 0,
      overall_mastery: overallMastery,
      weak_topics: weakTopics,
      strong_topics: strongTopics,
    },
    nodes,
    stats: {
      total_concepts: nodes.length,
      total_study_minutes: totalMinutes,
      estimated_days: estimatedDays,
      coverage_by_topic: coverageByTopic,
      depth_distribution: depthDist as any,
    },
    intro: generateIntro(scope, exam.name, nodes.length, estimatedDays),
    closing: generateClosing(scope),
  };
}
