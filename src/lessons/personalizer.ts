// @ts-nocheck
/**
 * Personalizer
 *
 * Takes a base Lesson (from the composer) and a StudentSnapshot, and
 * returns a new Lesson with student-aware adjustments. Idempotent:
 * missing student data = identity transform (returns base unchanged).
 *
 * This is a PURE function — does not mutate its inputs. The personalizer's
 * job is to DECIDE, not to generate. It reorders, filters, and expands
 * what the composer produced; it never writes new content.
 *
 * Each rule is independent and documented. Adding a new rule is a local
 * change — drop a new function into the pipeline.
 */

import type {
  Lesson,
  LessonComponent,
  StudentSnapshot,
  CommonTrapsComponent,
} from './types';
import { COMPONENT_ORDER } from './types';

// ============================================================================
// Rule types — each returns a modified lesson + a note for the audit trail
// ============================================================================

type PersonalizationRule = (lesson: Lesson, student: StudentSnapshot) => {
  lesson: Lesson;
  note: string | null;
};

// ============================================================================
// Rule: skip Hook when student already has high topic mastery
// ============================================================================

const ruleSkipHookOnHighMastery: PersonalizationRule = (lesson, student) => {
  const topicMastery = student.mastery_by_topic?.[lesson.topic] ?? 0;
  if (topicMastery < 0.75) return { lesson, note: null };
  const components = lesson.components.filter(c => c.kind !== 'hook');
  if (components.length === lesson.components.length) return { lesson, note: null };
  return {
    lesson: { ...lesson, components },
    note: `skip_hook_due_to_high_topic_mastery (${topicMastery.toFixed(2)})`,
  };
};

// ============================================================================
// Rule: expand Common Traps when student has matching error history
// ============================================================================

const ruleExpandTrapsOnErrorHistory: PersonalizationRule = (lesson, student) => {
  const errorsForConcept = (student.recent_errors || [])
    .filter(e => e.concept_id === lesson.concept_id);
  if (errorsForConcept.length === 0) return { lesson, note: null };
  const errorTypes = new Set(errorsForConcept.map(e => e.error_type));

  const components = lesson.components.map(c => {
    if (c.kind !== 'common_traps') return c;
    const t = c as CommonTrapsComponent;
    // Sort traps so those matching the student's error types come first
    const sortedTraps = [...t.traps].sort((a, b) => {
      const aMatch = a.error_type && errorTypes.has(a.error_type) ? 1 : 0;
      const bMatch = b.error_type && errorTypes.has(b.error_type) ? 1 : 0;
      return bMatch - aMatch;
    });
    return { ...t, traps: sortedTraps };
  });

  return {
    lesson: { ...lesson, components },
    note: `expand_traps_due_to_errors (${[...errorTypes].join(',')})`,
  };
};

// ============================================================================
// Rule: collapse Formal Statement when scope is speed-focused
// ============================================================================

const ruleCollapseFormalOnFastScope: PersonalizationRule = (lesson, student) => {
  if (student.scope !== 'mcq-fast') return { lesson, note: null };
  const components = lesson.components.filter(c => c.kind !== 'formal_statement');
  if (components.length === lesson.components.length) return { lesson, note: null };
  return {
    lesson: { ...lesson, components },
    note: 'collapse_formal_due_to_mcq_fast_scope',
  };
};

// ============================================================================
// Rule: re-order for spaced-review visits (lead with retrieval practice)
// ============================================================================

const ruleReorderForRevisit: PersonalizationRule = (lesson, student) => {
  const last = student.last_lesson_visit?.[lesson.concept_id];
  if (!last || last.visit_count < 2) return { lesson, note: null };

  // Put micro_exercise and common_traps at the front; push hook + intuition later
  const byKind: Record<string, LessonComponent[]> = {};
  for (const c of lesson.components) (byKind[c.kind] ||= []).push(c);
  const revisitOrder: Array<LessonComponent['kind']> = [
    'micro_exercise',
    'common_traps',
    'formal_statement',
    'worked_example',
    'definition',
    'intuition',
    'hook',
    'connections',
  ];
  const reordered: LessonComponent[] = [];
  for (const kind of revisitOrder) {
    for (const c of (byKind[kind] || [])) reordered.push(c);
  }

  return {
    lesson: { ...lesson, components: reordered, is_revisit: true },
    note: `reorder_for_revisit (visit_count=${last.visit_count})`,
  };
};

// ============================================================================
// Rule: tag that User Material was used — helps the UI show provenance
// ============================================================================

const ruleAnnotateUserMaterials: PersonalizationRule = (lesson, student) => {
  if (!student.has_materials) return { lesson, note: null };
  const anyUserSourced = lesson.components.some(
    c => (c as any).attribution?.kind === 'user-material',
  );
  if (!anyUserSourced) return { lesson, note: null };
  return { lesson, note: 'user_material_surfaced' };
};

// ============================================================================
// Rule: if the student has high mastery (>0.85), skip to micro_exercise only
// ============================================================================

const ruleSpotCheckHighMastery: PersonalizationRule = (lesson, student) => {
  const mastery = student.mastery_by_concept?.[lesson.concept_id] ?? 0;
  if (mastery < 0.85) return { lesson, note: null };
  // Keep only micro_exercise + connections; the rest is redundant for mastered concept
  const components = lesson.components.filter(
    c => c.kind === 'micro_exercise' || c.kind === 'connections',
  );
  if (components.length === 0) return { lesson, note: null };
  return {
    lesson: { ...lesson, components },
    note: `spot_check_due_to_high_mastery (${mastery.toFixed(2)})`,
  };
};

// ============================================================================
// Main personalizer — composes rules in order
// ============================================================================

const RULES: PersonalizationRule[] = [
  ruleSpotCheckHighMastery,          // Most aggressive first — if mastered, strip everything
  ruleSkipHookOnHighMastery,
  ruleCollapseFormalOnFastScope,
  ruleReorderForRevisit,
  ruleExpandTrapsOnErrorHistory,
  ruleAnnotateUserMaterials,
];

export function personalize(base: Lesson, student?: StudentSnapshot): Lesson {
  if (!student) return base;
  let current = base;
  const notes: string[] = [];
  for (const rule of RULES) {
    const result = rule(current, student);
    current = result.lesson;
    if (result.note) notes.push(result.note);
  }
  return {
    ...current,
    personalization_applied: notes,
  };
}
