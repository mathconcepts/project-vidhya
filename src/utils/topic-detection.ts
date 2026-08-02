// @ts-nocheck
// Keyword-based topic detection — exam-agnostic; defaults to the
// deployment's active exam (see src/exams/default-exam.ts).
// Used by chat-routes, gate-routes to auto-tag notebook entries

import { getKeywordsForExam } from '../curriculum/topic-adapter';
import { resolveActiveExamId } from '../curriculum/exam-loader';

// Was `process.env.DEFAULT_EXAM_ID ?? 'gate-ma'`, computed once at module
// load — a silent GATE fallback independent of every other surface's exam
// resolution. Default parameters evaluate per call, so this now re-resolves
// each call and agrees with GET /api/exam/active.
export function detectTopic(text: string, examId = resolveActiveExamId() ?? 'gate-ma'): string {
  const lower = text.toLowerCase();
  const keywords = getKeywordsForExam(examId);
  let bestMatch = 'general';
  let maxHits = 0;

  for (const [topic, kws] of Object.entries(keywords)) {
    const hits = kws.filter(kw => lower.includes(kw)).length;
    if (hits > maxHits) {
      maxHits = hits;
      bestMatch = topic;
    }
  }

  return bestMatch;
}
