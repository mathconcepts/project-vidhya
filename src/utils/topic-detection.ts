// @ts-nocheck
// Keyword-based topic detection for GATE Engineering Mathematics
// Used by chat-routes, gate-routes to auto-tag notebook entries

import { getKeywordsForExam } from '../curriculum/topic-adapter';

const DEFAULT_EXAM_ID = process.env.DEFAULT_EXAM_ID ?? 'gate-ma';

export function detectTopic(text: string, examId = DEFAULT_EXAM_ID): string {
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
