// @ts-nocheck
/**
 * BITSAT Mathematics — exam adapter.
 *
 * Demonstrates the plugin pattern: this file is self-contained, calls
 * registerExamAdapter() at import time, and requires zero changes to
 * orchestrator code to be picked up.
 *
 * To add a new exam: copy this file, change the exam_id/code/name,
 * replace the BITSAT-specific imports with your own content module,
 * and add a line to src/exams/adapters/index.ts.
 */

import { registerExamAdapter, type ExamAdapter } from '../../exam-builder/registry';
import {
  BITSAT_EXAM, BITSAT_MOCK_EXAM, LESSON_LIMITS, BITSAT_STRATEGIES,
} from '../../samples/bitsat-mathematics';

const adapter: ExamAdapter = {
  exam_id: BITSAT_EXAM.id,
  exam_code: BITSAT_EXAM.code,
  exam_name: BITSAT_EXAM.name,
  level: BITSAT_EXAM.level,
  description: BITSAT_EXAM.description,
  adapter_version: '1.0.0',

  loadBaseContent() {
    return {
      exam: BITSAT_EXAM,
      mocks: [BITSAT_MOCK_EXAM],
      lessons: [LESSON_LIMITS],
      strategies: BITSAT_STRATEGIES.strategies.map(s => ({
        title: s.title, content: s.content, evidence: s.evidence,
      })),
    };
  },

  getSyllabusTopicIds() {
    return BITSAT_EXAM.syllabus_topic_ids;
  },

  defaultGenerationSections(opts) {
    // BITSAT is 100% MCQ — generation asks for MCQs across priority topics
    const topics = opts?.topic_ids ?? BITSAT_EXAM.priority_concepts;
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
    // BITSAT-specific: ensure no duplicate question ids across mocks.
    const seen = new Set<string>();
    for (const mock of snapshot.mocks ?? []) {
      mock.questions = (mock.questions ?? []).filter((q: any) => {
        if (!q.id) return true;
        if (seen.has(q.id)) return false;
        seen.add(q.id);
        return true;
      });
    }
    return snapshot;
  },
};

registerExamAdapter(adapter);

export default adapter;
