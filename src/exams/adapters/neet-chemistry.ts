// @ts-nocheck
/**
 * NEET Chemistry — exam adapter.
 *
 * Follows the EXAMS.md recipe: 2 files (this + the sample), 1 line in
 * src/exams/adapters/index.ts. Mirrors the NEET Biology + Physics
 * pattern; together they form the full NEET-UG triad.
 *
 * Why a separate adapter from NEET Biology and Physics: chemistry's
 * three sub-disciplines (Physical / Organic / Inorganic) have
 * fundamentally different study patterns. Physical is calculation-
 * heavy like Physics; Organic is mechanism-pattern-heavy; Inorganic
 * is fact-recall-heavy like Biology. The student model needs to
 * track mastery within these three sub-buckets independently —
 * implemented via the question's `branch` field at the data layer.
 */

import { registerExamAdapter, type ExamAdapter } from '../../exam-builder/registry';
import {
  NEET_CHEM_EXAM, NEET_CHEM_MOCK_EXAM, NEET_CHEM_STRATEGIES,
} from '../../samples/neet-chemistry';

const adapter: ExamAdapter = {
  exam_id: NEET_CHEM_EXAM.id,
  exam_code: NEET_CHEM_EXAM.code,
  exam_name: NEET_CHEM_EXAM.name,
  level: NEET_CHEM_EXAM.level,
  description: NEET_CHEM_EXAM.description,
  adapter_version: '1.0.0',

  loadBaseContent() {
    return {
      exam: NEET_CHEM_EXAM,
      mocks: [NEET_CHEM_MOCK_EXAM],
      // No exam-specific lessons — relies on the shared lesson bank,
      // same scope discipline as NEET Biology, NEET Physics, and JEE.
      lessons: [],
      strategies: NEET_CHEM_STRATEGIES.strategies.map(s => ({
        title: s.title, content: s.content, evidence: s.evidence,
      })),
    };
  },

  getSyllabusTopicIds() {
    return NEET_CHEM_EXAM.syllabus_topic_ids;
  },

  defaultGenerationSections(opts) {
    // NEET Chemistry is 100% MCQ across three sub-disciplines. Focus
    // generation on priority concepts (mole-concept, chemical-bonding,
    // hydrocarbons) which are the foundation everything else depends on.
    const topics = opts?.topic_ids ?? NEET_CHEM_EXAM.priority_concepts;
    const count = opts?.count_per_topic ?? 3;
    const sections: Array<{ kind: 'mock_question'; topic_id: string; difficulty: string }> = [];
    for (const topic_id of topics) {
      for (let i = 0; i < count; i++) {
        sections.push({
          kind: 'mock_question',
          topic_id,
          difficulty: i === 0 ? 'easy' : i === 1 ? 'medium' : 'hard',
        });
      }
    }
    return sections;
  },

  postProcessSnapshot(snapshot) {
    // Same dedupe + exam-day-notes pattern, with chemistry's three-
    // branches reminder. The branch metadata on each question lets
    // the UI surface "Physical / Organic / Inorganic" tags.
    const seen = new Set<string>();
    for (const mock of snapshot.mocks ?? []) {
      mock.questions = (mock.questions ?? []).filter((q: any) => {
        if (!q.id) return true;
        if (seen.has(q.id)) return false;
        seen.add(q.id);
        return true;
      });
    }
    snapshot._exam_day_notes = {
      calculator: 'Not permitted',
      negative_marking: '-1 per wrong (25% of +4 correct)',
      pacing_target:
        '50 min for 45 Q ≈ 67 sec/Q. Physical chemistry numerical questions ' +
        'are the longest; first pass them as a separate sweep.',
      branch_balance:
        'Three sub-disciplines (Physical / Organic / Inorganic) get ~equal weight. ' +
        'Aim for balanced attempts across all three rather than burning budget on one.',
    };
    return snapshot;
  },
};

registerExamAdapter(adapter);

export default adapter;
