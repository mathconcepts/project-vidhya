// @ts-nocheck
/**
 * Spine Screen API (U1-4, Vidhya Master Design & Backlog)
 *
 * The spine screen renders "topics × Learn/Practice/Prove/Retain" — the
 * loop's per-topic honesty mechanism. Per the design doc (Learning
 * Platform Narrative Design §3.2), this screen makes "no new engine
 * calls: renders from bundle metadata + existing readiness data."
 *
 * This route supplies the one piece not already exposed anywhere: the
 * "Learn" segment's real depth signal — how many of a topic's bundled
 * concept explainers are curated vs thin auto-generated stubs (see
 * src/content/resolver.ts's explainerCoverageByTopic, a pure readout of
 * the already-loaded static bundle — no generation, no DB).
 *
 * Practice/Prove/Retain are deliberately NOT computed here — the
 * frontend composes them from the existing GET /api/topics (problem
 * counts) and GET /api/progress/:sessionId (attempts/mastery/due)
 * endpoints, exactly as the design doc specifies.
 *
 *   GET /api/spine — per-topic Learn coverage for the active exam
 */

import { ServerResponse } from 'http';
import { explainerCoverageByTopic } from '../content/resolver';
import { getTopicsForExam } from '../curriculum/topic-adapter';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON } from '../lib/route-helpers';

const DEFAULT_EXAM_ID = process.env.DEFAULT_EXAM_ID ?? 'gate-ma';

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

export type LearnStatus = 'available' | 'partial' | 'expanding';

async function handleGetSpine(_req: ParsedRequest, res: ServerResponse): Promise<void> {
  const topics = getTopicsForExam(DEFAULT_EXAM_ID);
  const coverage = explainerCoverageByTopic();
  const byTopic = new Map(coverage.map(c => [c.topic, c]));

  const learn = topics.map(t => {
    const c = byTopic.get(t.id);
    const totalConcepts = c?.total_concepts ?? 0;
    const curatedConcepts = c?.curated_concepts ?? 0;

    // Labels never lie: a topic is only "available" once every bundled
    // concept it has is curated; any real-but-incomplete coverage is
    // "partial" (S0's partial state — shown, marked, never rounded up);
    // zero curated concepts is honestly "expanding", never a fabricated
    // percentage.
    let status: LearnStatus;
    if (totalConcepts === 0 || curatedConcepts === 0) status = 'expanding';
    else if (curatedConcepts >= totalConcepts) status = 'available';
    else status = 'partial';

    return {
      topic: t.id,
      name: t.name,
      icon: t.icon,
      weight_pct: t.weight_pct,
      total_concepts: totalConcepts,
      curated_concepts: curatedConcepts,
      status,
    };
  });

  sendJSON(res, { learn });
}

export const spineRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/spine', handler: handleGetSpine },
];
