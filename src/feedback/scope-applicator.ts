// @ts-nocheck
/**
 * Scope Applicator — the generic framework that takes approved feedback
 * and produces a PATCH to an exam's scope (syllabus, weights, mock,
 * lessons, strategies).
 *
 * This is the piece that makes "same framework, all exams" actually true.
 * It knows nothing about BITSAT, GATE, NEET specifically — it operates on
 * the generic Exam interface + a registry of applier functions per
 * FeedbackKind.
 *
 * Two-phase design:
 *
 *   1. PROPOSE: given approved feedback, compute a ScopePatch — a
 *      structured description of what SHOULD change. Pure function,
 *      no mutation. Reviewable.
 *
 *   2. APPLY: given a ScopePatch + the current exam content, return
 *      the new exam content. Pure function. Called by the specific
 *      exam's adapter (e.g. src/samples/bitsat-mathematics.ts
 *      subscribes to patches targeting BITSAT).
 *
 * Why two phases: lets us preview patches, batch multiple approved
 * items before a release, and generate the release notes automatically.
 */

import type { FeedbackItem } from './types';

// ============================================================================
// Patch vocabulary — every possible structured change to exam scope
// ============================================================================

export type ScopePatchOp =
  /** Add a new syllabus topic */
  | {
      op: 'add_syllabus_topic';
      topic_id: string;
      label: string;
      class_level?: number;
      weight?: number;         // Optional — if not given, reviewer sets it
    }
  /** Remove a syllabus topic (rare — usually happens when exam changes officially) */
  | {
      op: 'remove_syllabus_topic';
      topic_id: string;
      label: string;
    }
  /** Change weight of an existing topic */
  | {
      op: 'adjust_topic_weight';
      topic_id: string;
      old_weight: number;
      new_weight: number;
      rationale: string;
    }
  /** Fix a mock question — change correct option, edit prompt, or replace */
  | {
      op: 'fix_mock_question';
      mock_id: string;
      question_id: string;
      fix_kind: 'change_correct_option' | 'edit_prompt' | 'edit_option_text' | 'replace_full';
      before: any;
      after: any;
    }
  /** Add a new mock question */
  | {
      op: 'add_mock_question';
      mock_id: string;
      question: any;
      rationale: string;
    }
  /** Fix a lesson component (worked-example step, trap wording, connection) */
  | {
      op: 'fix_lesson_component';
      lesson_id: string;
      component_id: string;
      fix_kind: 'edit_content' | 'fix_trap' | 'add_trap' | 'remove_trap' | 'add_connection';
      before?: any;
      after: any;
    }
  /** Add a strategy */
  | {
      op: 'add_strategy';
      title: string;
      content: string;
      evidence: string;
    }
  /** Edit an existing strategy */
  | {
      op: 'edit_strategy';
      title: string;
      before: { content: string };
      after: { content: string };
    }
  /** Fix exam metadata (date, duration, marking) */
  | {
      op: 'fix_exam_metadata';
      field: string;
      before: any;
      after: any;
    };

export interface ScopePatch {
  patch_id: string;
  exam_id: string;
  source_feedback_ids: string[];    // Which feedback(s) this came from
  ops: ScopePatchOp[];
  proposed_at: string;
  proposed_by: string;                // Admin who approved + generated patch
  human_summary: string;               // One-sentence release-note-ready summary
}

// ============================================================================
// PROPOSE phase — given feedback, compute a ScopePatch
// ============================================================================

/**
 * Registry of applier functions per FeedbackKind. Each function takes an
 * approved feedback item and returns the ScopePatchOps that item would
 * produce. Pure — no I/O, no mutation.
 *
 * This is the extension point. Adding a new FeedbackKind means adding
 * a row here. Nothing else changes.
 */
const PROPOSERS: Record<string, (item: FeedbackItem) => ScopePatchOp[]> = {

  mock_question_error: (item) => {
    const s = item.suggestion ?? {};
    if (!item.target.question_id || !item.target.mock_id) return [];
    return [{
      op: 'fix_mock_question',
      mock_id: item.target.mock_id,
      question_id: item.target.question_id,
      fix_kind: s.fix_kind ?? 'change_correct_option',
      before: s.before ?? null,
      after: s.after ?? s.proposed_correct_option ?? null,
    }];
  },

  mock_coverage_gap: (item) => {
    const s = item.suggestion ?? {};
    if (!item.target.mock_id || !s.proposed_question) return [];
    return [{
      op: 'add_mock_question',
      mock_id: item.target.mock_id,
      question: s.proposed_question,
      rationale: item.description,
    }];
  },

  syllabus_missing_topic: (item) => {
    const s = item.suggestion ?? {};
    if (!s.topic_id || !s.label) return [];
    return [{
      op: 'add_syllabus_topic',
      topic_id: s.topic_id,
      label: s.label,
      class_level: s.class_level,
      weight: s.weight,
    }];
  },

  topic_weight_recalibration: (item) => {
    const s = item.suggestion ?? {};
    if (!item.target.topic_id || typeof s.proposed_weight !== 'number') return [];
    return [{
      op: 'adjust_topic_weight',
      topic_id: item.target.topic_id,
      old_weight: s.current_weight ?? 0,
      new_weight: s.proposed_weight,
      rationale: item.description,
    }];
  },

  lesson_content_error: (item) => {
    const s = item.suggestion ?? {};
    if (!item.target.lesson_id || !item.target.component_id) return [];
    return [{
      op: 'fix_lesson_component',
      lesson_id: item.target.lesson_id,
      component_id: item.target.component_id,
      fix_kind: s.fix_kind ?? 'edit_content',
      before: s.before,
      after: s.after,
    }];
  },

  trap_mismatch: (item) => {
    const s = item.suggestion ?? {};
    if (!item.target.lesson_id || !item.target.component_id) return [];
    return [{
      op: 'fix_lesson_component',
      lesson_id: item.target.lesson_id,
      component_id: item.target.component_id,
      fix_kind: 'fix_trap',
      before: s.before,
      after: s.after,
    }];
  },

  trap_addition: (item) => {
    const s = item.suggestion ?? {};
    if (!item.target.lesson_id || !item.target.component_id || !s.proposed_trap) return [];
    return [{
      op: 'fix_lesson_component',
      lesson_id: item.target.lesson_id,
      component_id: item.target.component_id,
      fix_kind: 'add_trap',
      after: s.proposed_trap,
    }];
  },

  strategy_preference: (item) => {
    const s = item.suggestion ?? {};
    if (!item.target.strategy_title || !s.proposed_content) return [];
    return [{
      op: 'edit_strategy',
      title: item.target.strategy_title,
      before: { content: s.current_content ?? '' },
      after: { content: s.proposed_content },
    }];
  },

  strategy_addition: (item) => {
    const s = item.suggestion ?? {};
    if (!s.title || !s.content) return [];
    return [{
      op: 'add_strategy',
      title: s.title,
      content: s.content,
      evidence: s.evidence ?? item.description,
    }];
  },

  exam_metadata_error: (item) => {
    const s = item.suggestion ?? {};
    if (!s.field) return [];
    return [{
      op: 'fix_exam_metadata',
      field: s.field,
      before: s.before,
      after: s.after,
    }];
  },

  other: () => [],   // Other feedback needs human-written patch
};

/**
 * Propose a patch from one or more approved feedback items. All items
 * must target the same exam_id.
 */
export function proposePatch(
  items: FeedbackItem[],
  proposed_by: string,
): ScopePatch | null {
  if (items.length === 0) return null;
  const exam_id = items[0].target.exam_id;
  for (const i of items) {
    if (i.target.exam_id !== exam_id) {
      throw new Error(`All feedback items must target the same exam_id. Got ${exam_id} and ${i.target.exam_id}.`);
    }
    if (i.status !== 'approved') {
      throw new Error(`Only approved feedback can be proposed into a patch. Item ${i.id} is ${i.status}.`);
    }
  }

  const ops: ScopePatchOp[] = [];
  for (const item of items) {
    const proposer = PROPOSERS[item.kind];
    if (!proposer) continue;
    ops.push(...proposer(item));
  }

  const opsSummary = summarizeOps(ops);
  const idSuffix = Math.random().toString(36).slice(2, 10);

  return {
    patch_id: `PATCH-${idSuffix}`,
    exam_id,
    source_feedback_ids: items.map(i => i.id),
    ops,
    proposed_at: new Date().toISOString(),
    proposed_by,
    human_summary: opsSummary,
  };
}

function summarizeOps(ops: ScopePatchOp[]): string {
  const counts: Record<string, number> = {};
  for (const op of ops) counts[op.op] = (counts[op.op] ?? 0) + 1;
  const parts: string[] = [];
  if (counts['add_syllabus_topic']) parts.push(`added ${counts['add_syllabus_topic']} syllabus topic(s)`);
  if (counts['remove_syllabus_topic']) parts.push(`removed ${counts['remove_syllabus_topic']} syllabus topic(s)`);
  if (counts['adjust_topic_weight']) parts.push(`recalibrated ${counts['adjust_topic_weight']} topic weight(s)`);
  if (counts['fix_mock_question']) parts.push(`fixed ${counts['fix_mock_question']} mock question(s)`);
  if (counts['add_mock_question']) parts.push(`added ${counts['add_mock_question']} mock question(s)`);
  if (counts['fix_lesson_component']) parts.push(`updated ${counts['fix_lesson_component']} lesson component(s)`);
  if (counts['add_strategy']) parts.push(`added ${counts['add_strategy']} strateg(ies)`);
  if (counts['edit_strategy']) parts.push(`edited ${counts['edit_strategy']} strateg(ies)`);
  if (counts['fix_exam_metadata']) parts.push(`fixed ${counts['fix_exam_metadata']} metadata field(s)`);
  if (parts.length === 0) return 'no-op patch';
  return parts.join('; ');
}

// ============================================================================
// APPLY phase — apply a patch to exam content
// ============================================================================

/**
 * The exam content shape the applicator expects. Any exam can satisfy
 * this shape — including the BITSAT sample.
 */
export interface ExamContent {
  exam: any;                  // The Exam record (mutable copy)
  mocks: Array<{ id: string; title: string; questions: any[] }>;
  lessons: Array<{ id: string; components: any[] }>;
  strategies: Array<{ title: string; content: string; evidence: string }>;
}

/**
 * Apply a patch to exam content. Returns a NEW ExamContent — does not
 * mutate the input. Idempotent per-op: applying the same op twice is a
 * no-op for the second application.
 *
 * Exam-specific modules (e.g. src/samples/bitsat-mathematics.ts) call
 * this function with their current content + a patch to produce the
 * next version.
 */
export function applyPatch(content: ExamContent, patch: ScopePatch): ExamContent {
  // Deep-clone to avoid mutating caller's content
  const next: ExamContent = JSON.parse(JSON.stringify(content));
  const report: string[] = [];

  for (const op of patch.ops) {
    try {
      applyOp(next, op, report);
    } catch (err) {
      report.push(`  FAILED ${op.op}: ${(err as Error).message}`);
    }
  }

  // Attach report as hidden field for caller introspection
  (next as any)._last_patch_report = report;
  return next;
}

function applyOp(content: ExamContent, op: ScopePatchOp, report: string[]): void {
  switch (op.op) {
    case 'add_syllabus_topic': {
      const exists = content.exam.syllabus?.some((t: any) => t.label === op.label);
      if (exists) { report.push(`  skipped add_syllabus_topic '${op.label}' — already present`); return; }
      content.exam.syllabus = content.exam.syllabus ?? [];
      content.exam.syllabus.push({
        topic_id: op.topic_id,
        label: op.label,
        class_level: op.class_level,
      });
      if (op.weight !== undefined) {
        content.exam.topic_weights = content.exam.topic_weights ?? {};
        content.exam.topic_weights[op.topic_id] =
          (content.exam.topic_weights[op.topic_id] ?? 0) + op.weight;
      }
      if (!content.exam.syllabus_topic_ids?.includes(op.topic_id)) {
        content.exam.syllabus_topic_ids = [...(content.exam.syllabus_topic_ids ?? []), op.topic_id];
      }
      report.push(`  added syllabus topic: ${op.label} (${op.topic_id})`);
      break;
    }

    case 'remove_syllabus_topic': {
      if (!content.exam.syllabus) return;
      const before = content.exam.syllabus.length;
      content.exam.syllabus = content.exam.syllabus.filter(
        (t: any) => !(t.topic_id === op.topic_id && t.label === op.label)
      );
      report.push(`  removed ${before - content.exam.syllabus.length} matching syllabus entries for ${op.label}`);
      break;
    }

    case 'adjust_topic_weight': {
      if (!content.exam.topic_weights) return;
      content.exam.topic_weights[op.topic_id] = op.new_weight;
      report.push(`  weight ${op.topic_id}: ${op.old_weight} → ${op.new_weight}`);
      break;
    }

    case 'fix_mock_question': {
      const mock = content.mocks.find(m => m.id === op.mock_id);
      if (!mock) { report.push(`  FAILED fix_mock_question: mock ${op.mock_id} not found`); return; }
      const q = mock.questions.find((q: any) => q.id === op.question_id);
      if (!q) { report.push(`  FAILED fix_mock_question: question ${op.question_id} not found`); return; }

      if (op.fix_kind === 'change_correct_option') {
        const newIdx = typeof op.after === 'number' ? op.after : -1;
        if (newIdx < 0 || newIdx >= q.options.length) {
          report.push(`  FAILED change_correct_option: index ${newIdx} out of range`);
          return;
        }
        q.options.forEach((o: any, i: number) => { o.is_correct = i === newIdx; });
        report.push(`  ${op.question_id} correct option → index ${newIdx}`);
      } else if (op.fix_kind === 'edit_prompt') {
        q.prompt = op.after;
        report.push(`  ${op.question_id} prompt updated`);
      } else if (op.fix_kind === 'edit_option_text') {
        const { index, text } = op.after;
        if (q.options[index]) q.options[index].text = text;
        report.push(`  ${op.question_id} option ${index} text updated`);
      } else if (op.fix_kind === 'replace_full') {
        Object.assign(q, op.after);
        report.push(`  ${op.question_id} fully replaced`);
      }
      break;
    }

    case 'add_mock_question': {
      const mock = content.mocks.find(m => m.id === op.mock_id);
      if (!mock) { report.push(`  FAILED add_mock_question: mock ${op.mock_id} not found`); return; }
      mock.questions.push(op.question);
      report.push(`  added question to ${op.mock_id}: ${op.question.id ?? '(no id)'}`);
      break;
    }

    case 'fix_lesson_component': {
      const lesson = content.lessons.find(l => l.id === op.lesson_id);
      if (!lesson) { report.push(`  FAILED fix_lesson_component: lesson ${op.lesson_id} not found`); return; }
      const comp = lesson.components.find((c: any) => c.id === op.component_id);
      if (!comp) { report.push(`  FAILED fix_lesson_component: component ${op.component_id} not found`); return; }

      if (op.fix_kind === 'edit_content') {
        if (op.after?.content) comp.content = op.after.content;
        if (op.after?.latex) comp.latex = op.after.latex;
        report.push(`  ${op.lesson_id}:${op.component_id} content updated`);
      } else if (op.fix_kind === 'fix_trap') {
        const traps = comp.traps ?? [];
        const idx = op.before?.index;
        if (typeof idx === 'number' && traps[idx]) {
          Object.assign(traps[idx], op.after);
          report.push(`  ${op.component_id} trap[${idx}] updated`);
        }
      } else if (op.fix_kind === 'add_trap') {
        comp.traps = comp.traps ?? [];
        comp.traps.push(op.after);
        report.push(`  ${op.component_id} trap added`);
      } else if (op.fix_kind === 'remove_trap') {
        const idx = op.before?.index;
        if (typeof idx === 'number' && comp.traps) {
          comp.traps.splice(idx, 1);
          report.push(`  ${op.component_id} trap[${idx}] removed`);
        }
      } else if (op.fix_kind === 'add_connection') {
        comp.connections = comp.connections ?? [];
        comp.connections.push(op.after);
        report.push(`  ${op.component_id} connection added`);
      }
      break;
    }

    case 'add_strategy': {
      const exists = content.strategies.some(s => s.title === op.title);
      if (exists) { report.push(`  skipped add_strategy '${op.title}' — already present`); return; }
      content.strategies.push({ title: op.title, content: op.content, evidence: op.evidence });
      report.push(`  added strategy: ${op.title}`);
      break;
    }

    case 'edit_strategy': {
      const s = content.strategies.find(s => s.title === op.title);
      if (!s) { report.push(`  FAILED edit_strategy: '${op.title}' not found`); return; }
      s.content = op.after.content;
      report.push(`  edited strategy: ${op.title}`);
      break;
    }

    case 'fix_exam_metadata': {
      (content.exam as any)[op.field] = op.after;
      report.push(`  metadata.${op.field}: ${JSON.stringify(op.before)} → ${JSON.stringify(op.after)}`);
      break;
    }
  }
}

// ============================================================================
// PREVIEW — show what a patch would do without persisting
// ============================================================================

export function previewPatch(
  content: ExamContent,
  patch: ScopePatch,
): { would_apply: ExamContent; report: string[] } {
  const clone = applyPatch(content, patch);
  const report = ((clone as any)._last_patch_report as string[]) ?? [];
  delete (clone as any)._last_patch_report;
  return { would_apply: clone, report };
}
