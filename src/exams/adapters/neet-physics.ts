// @ts-nocheck
/**
 * NEET Physics — exam adapter.
 *
 * Follows the EXAMS.md recipe: 2 files (this + the sample), 1 line in
 * src/exams/adapters/index.ts. Mirrors the NEET Biology pattern that
 * shipped first; together with NEET Chemistry, completes the NEET-UG
 * triad (Physics + Chemistry + Biology = full medical-entrance paper).
 *
 * Why a separate adapter from NEET Biology: each subject has its own
 * topic taxonomy and the student model treats subject mastery
 * independently. Physics is also the time-sink subject — pacing
 * strategy differs sharply from Biology — so the strategies layer
 * carries different content per subject.
 */

import { registerExamAdapter, type ExamAdapter } from '../../exam-builder/registry';
import {
  NEET_PHYS_EXAM, NEET_PHYS_MOCK_EXAM, NEET_PHYS_STRATEGIES,
} from '../../samples/neet-physics';

const adapter: ExamAdapter = {
  exam_id: NEET_PHYS_EXAM.id,
  exam_code: NEET_PHYS_EXAM.code,
  exam_name: NEET_PHYS_EXAM.name,
  level: NEET_PHYS_EXAM.level,
  description: NEET_PHYS_EXAM.description,
  adapter_version: '1.0.0',

  loadBaseContent() {
    return {
      exam: NEET_PHYS_EXAM,
      mocks: [NEET_PHYS_MOCK_EXAM],
      // No exam-specific lessons — relies on the shared lesson bank,
      // same scope discipline as NEET Biology and JEE Main.
      lessons: [],
      strategies: NEET_PHYS_STRATEGIES.strategies.map(s => ({
        title: s.title, content: s.content, evidence: s.evidence,
      })),
    };
  },

  getSyllabusTopicIds() {
    return NEET_PHYS_EXAM.syllabus_topic_ids;
  },

  defaultGenerationSections(opts) {
    // NEET Physics is 100% MCQ. Focus generation on priority concepts
    // (mechanics, electromagnetism, modern physics) which together
    // cover ~60% of marks.
    const topics = opts?.topic_ids ?? NEET_PHYS_EXAM.priority_concepts;
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
    // Same dedupe + exam-day-notes pattern as NEET Biology, with
    // physics-specific pacing emphasis.
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
        'Physics is the time-sink subject — 50 min for 45 Q ≈ 67 sec/Q. ' +
        'First-pass cap 60s/Q; second pass on marked questions only.',
      time_discipline:
        'NEVER spend >2 min on a single question regardless of how close you feel.',
    };
    return snapshot;
  },
};

registerExamAdapter(adapter);

export default adapter;
