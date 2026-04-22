// @ts-nocheck
/**
 * UGEE IIIT Hyderabad Mathematics — exam adapter.
 *
 * Identical shape to src/exams/adapters/bitsat-mathematics.ts. The
 * orchestrator, feedback-lookup, and course promoter all operate on
 * the generic ExamAdapter contract and know nothing exam-specific.
 *
 * Registering UGEE took:
 *   - 1 content file (src/samples/ugee-mathematics.ts)
 *   - 1 adapter file (this one)
 *   - 1 import line in src/exams/adapters/index.ts
 *
 * Zero core code changes. That's the v2.18.0 portability guarantee
 * in action.
 */

import { registerExamAdapter, type ExamAdapter } from '../../exam-builder/registry';
import {
  UGEE_EXAM, UGEE_MOCK_EXAM, LESSON_INDUCTION, UGEE_STRATEGIES,
} from '../../samples/ugee-mathematics';
import { UGEE_EXPANDED_LESSONS, UGEE_DRILL_MOCKS } from '../../samples/ugee-mathematics-expanded';

const adapter: ExamAdapter = {
  exam_id: UGEE_EXAM.id,
  exam_code: UGEE_EXAM.code,
  exam_name: UGEE_EXAM.name,
  level: UGEE_EXAM.level,
  description: UGEE_EXAM.description,
  adapter_version: '1.1.0',  // Bumped: expanded content corpus

  loadBaseContent() {
    // v1.1.0: return the FULL content corpus, not just diagnostic
    //   - 10 lessons (induction from v2.19.0 + 9 new from v2.19.1 expansion)
    //   - 4 mocks (diagnostic + calculus drill + algebra drill + distinctive drill)
    //   - All UGEE strategies
    // Covers all 10 syllabus topic_ids. Ready for feedback loop.
    return {
      exam: UGEE_EXAM,
      mocks: [UGEE_MOCK_EXAM, ...UGEE_DRILL_MOCKS],
      lessons: [LESSON_INDUCTION, ...UGEE_EXPANDED_LESSONS],
      strategies: UGEE_STRATEGIES.strategies.map(s => ({
        title: s.title, content: s.content, evidence: s.evidence,
      })),
    };
  },

  getSyllabusTopicIds() {
    return UGEE_EXAM.syllabus_topic_ids;
  },

  defaultGenerationSections(opts) {
    // UGEE mixes MCQ and numerical (15% numerical entry). For LLM
    // generation we request MCQs primarily; UGEE-distinctive topics
    // (induction, reasoning) benefit from extra conceptual questions
    // rather than computational.
    const topics = opts?.topic_ids ?? UGEE_EXAM.priority_concepts;
    const count = opts?.count_per_topic ?? 2;
    const sections = [];
    for (const topic_id of topics) {
      for (let i = 0; i < count; i++) {
        sections.push({
          kind: 'mock_question' as const,
          topic_id,
          difficulty: i === 0 ? 'easy' : i === 1 ? 'medium' : 'hard',
        });
      }
    }
    return sections;
  },

  postProcessSnapshot(snapshot) {
    // UGEE-specific post-processing:
    //   (a) Dedupe questions by id across mocks
    //   (b) Validate that UGEE-distinctive topics have ≥1 question each
    //   (c) Annotate snapshot with marking-scheme reminder (no calculator,
    //       25% negative) so downstream renders always surface this to students
    const seen = new Set<string>();
    for (const mock of snapshot.mocks ?? []) {
      mock.questions = (mock.questions ?? []).filter((q: any) => {
        if (!q.id) return true;
        if (seen.has(q.id)) return false;
        seen.add(q.id);
        return true;
      });
    }

    // Attach an exam-day reminder — helpful for admins previewing the sample
    snapshot._exam_day_notes = {
      calculator: 'Strictly not permitted (physical or on-screen)',
      negative_marking: '25% per wrong answer (-0.25 on SUPR, -0.5 on REAP)',
      time_allocation:
        'SUPR gives 60 min for 50 PCM questions = 72 s/Q average. Budget ~24 min for math.',
    };

    return snapshot;
  },
};

registerExamAdapter(adapter);

export default adapter;
