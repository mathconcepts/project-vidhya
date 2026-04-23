// @ts-nocheck
/**
 * JEE Main Mathematics — exam adapter.
 *
 * Third bundled adapter, shipped in v2.31. Follows the same plugin
 * pattern as bitsat-mathematics.ts and ugee-mathematics.ts — this
 * file is self-contained, calls registerExamAdapter() at import
 * time, and requires zero changes to orchestrator code to be picked
 * up.
 *
 * JEE Main differs from BITSAT in three material ways the adapter
 * captures:
 *
 *   1. MIXED QUESTION TYPES. 20 MCQs + 10 NAT (numerical-answer-type).
 *      defaultGenerationSections asks for both kinds proportional
 *      to the exam's 20:10 ratio.
 *
 *   2. NEGATIVE MARKING ASYMMETRY. MCQs carry -1 for wrong answers;
 *      NATs carry 0. The exam spec captures this and downstream
 *      scoring code can branch on question_kind.
 *
 *   3. CALCULUS-HEAVY. priority_concepts leads with calculus, not
 *      linear algebra (BITSAT's lead). defaultGenerationSections
 *      reflects this via priority_concepts ordering.
 */

import { registerExamAdapter, type ExamAdapter } from '../../exam-builder/registry';
import {
  JEE_MAIN_EXAM, JEE_MAIN_MOCK_EXAM, JEE_MAIN_STRATEGIES, JEE_LESSON_MANIFEST,
} from '../../samples/jee-main-mathematics';

const adapter: ExamAdapter = {
  exam_id: JEE_MAIN_EXAM.id,
  exam_code: JEE_MAIN_EXAM.code,
  exam_name: JEE_MAIN_EXAM.name,
  level: JEE_MAIN_EXAM.level,
  description: JEE_MAIN_EXAM.description,
  adapter_version: '1.0.0',

  loadBaseContent() {
    return {
      exam: JEE_MAIN_EXAM,
      mocks: [JEE_MAIN_MOCK_EXAM],
      lessons: [],  // Lessons come from the shared bank; no duplicates here
      strategies: JEE_MAIN_STRATEGIES.strategies.map(s => ({
        title: s.title, content: s.content, evidence: s.evidence,
      })),
    };
  },

  getSyllabusTopicIds() {
    return JEE_MAIN_EXAM.syllabus_topic_ids;
  },

  defaultGenerationSections(opts) {
    // JEE Main: 20 MCQ + 10 NAT (1:2 ratio of NAT:MCQ per topic).
    // Weight calculus-first via priority_concepts ordering.
    const topics = opts?.topic_ids ?? JEE_MAIN_EXAM.priority_concepts;
    const countPerTopic = opts?.count_per_topic ?? 3;
    const sections = [];
    for (const topic_id of topics) {
      for (let i = 0; i < countPerTopic; i++) {
        // 2 out of every 3 are MCQs, 1 is NAT — mirrors the 20:10
        // exam ratio.
        const kind = i % 3 === 2 ? 'nat_question' as const : 'mock_question' as const;
        sections.push({
          kind,
          topic_id,
          difficulty: i === 0 ? 'easy' : i === 1 ? 'medium' : 'hard',
        });
      }
    }
    return sections;
  },

  postProcessSnapshot(snapshot) {
    // JEE-specific: the mock tagged each question as mcq|nat.
    // Pass-through here; downstream scoring uses the kind field
    // to apply the right marking rule.
    return snapshot;
  },
};

registerExamAdapter(adapter);

export default adapter;
