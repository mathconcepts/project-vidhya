// @ts-nocheck
/**
 * NEET Biology — exam adapter.
 *
 * Follows the EXAMS.md recipe: 2 files (this + the sample), 1 line
 * in src/exams/adapters/index.ts. Zero core code changes.
 *
 * PENDING.md §3.1 — NEET Biology was the highest-priority next
 * exam to add given its enormous target audience (~2 million NEET
 * candidates annually in India).
 */

import { registerExamAdapter, type ExamAdapter } from '../../exam-builder/registry';
import {
  NEET_BIO_EXAM, NEET_BIO_MOCK_EXAM, LESSON_MENDELIAN, NEET_BIO_STRATEGIES,
} from '../../samples/neet-biology';

const adapter: ExamAdapter = {
  exam_id: NEET_BIO_EXAM.id,
  exam_code: NEET_BIO_EXAM.code,
  exam_name: NEET_BIO_EXAM.name,
  level: NEET_BIO_EXAM.level,
  description: NEET_BIO_EXAM.description,
  adapter_version: '1.0.0',

  loadBaseContent() {
    return {
      exam: NEET_BIO_EXAM,
      mocks: [NEET_BIO_MOCK_EXAM],
      lessons: [LESSON_MENDELIAN],
      strategies: NEET_BIO_STRATEGIES.strategies.map(s => ({
        title: s.title, content: s.content, evidence: s.evidence,
      })),
    };
  },

  getSyllabusTopicIds() {
    return NEET_BIO_EXAM.syllabus_topic_ids;
  },

  defaultGenerationSections(opts) {
    // NEET is 100% MCQ, no numerical. LLM generation requests
    // focus on high-weight topics (genetics, ecology, physiology).
    const topics = opts?.topic_ids ?? NEET_BIO_EXAM.priority_concepts;
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
    // NEET-specific: dedupe questions + attach exam-day notes
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
      pacing_target: '~1 min per question; skim optional-15 before committing to 10',
    };
    return snapshot;
  },
};

registerExamAdapter(adapter);

export default adapter;
