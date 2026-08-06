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
 *      The exam spec (JEE_MAIN_EXAM) captures the 20:10 ratio. NOTE:
 *      defaultGenerationSections below requests every section as
 *      kind: 'mock_question' — GenerationSection.kind has no NAT
 *      variant, and nothing downstream (resolveContent, stitchSnapshot)
 *      distinguishes MCQ from NAT during generation. An earlier
 *      version of this method emitted 'nat_question' for 1-in-3
 *      sections, which silently dropped them from the stitched
 *      snapshot entirely (stitchSnapshot only recognizes
 *      mock_question/lesson_component/strategy) — found while removing
 *      this file's @ts-nocheck, since 'nat_question' isn't a valid
 *      GenerationSection.kind and TS caught the mismatch immediately.
 *      Fixed by requesting mock_question uniformly; format-aware
 *      generation is future work, not a regression from this fix.
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
import type { GenerationSection } from '../../sample-check/llm-generator';
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
    const sections: GenerationSection[] = [];
    for (const topic_id of topics) {
      for (let i = 0; i < countPerTopic; i++) {
        // All sections request mock_question — see the class docblock
        // above for why this isn't format-aware (MCQ vs NAT) yet.
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
    // JEE-specific: the mock tagged each question as mcq|nat.
    // Pass-through here; downstream scoring uses the kind field
    // to apply the right marking rule.
    return snapshot;
  },
};

registerExamAdapter(adapter);

export default adapter;
