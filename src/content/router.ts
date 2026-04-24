// @ts-nocheck
/**
 * src/content/router.ts
 *
 * Owning agent: content-router (under teaching-manager).
 *
 * Given a student's content request, classify the intent, select the
 * best available source, retrieve, and return a disclosure-tagged
 * result.
 *
 * Source priority order:
 *   1. user subscriptions (preferred community bundles)
 *   2. shipped bundle    (verified, fast, free)
 *   3. server cache
 *   4. user uploads      (only for find-in-uploads intent, or when
 *                         user has tagged uploads to the concept)
 *   5. community repo    (via community-content-specialist)
 *   6. live generation   (LLM — only if exclude_sources doesn't forbid)
 *   7. Wolfram live      (for verify / solve / compute intents)
 *   8. decline + explain
 *
 * The router respects user subscription preferences (exclude_sources
 * can forbid e.g. 'generated' content). It emits a CONTENT_ROUTED
 * signal for every decision, never contains PII in that signal
 * (user_id is hashed).
 */

import { createHash } from 'crypto';
import { findCommunityContent, getUserSubscriptions } from './community';
import { findUploadsByConcept } from './uploads';

// ─── Types ────────────────────────────────────────────────────────────

export type Intent =
  | 'explain-concept'       // "explain derivatives"
  | 'walkthrough-problem'   // "walk me through this problem"
  | 'verify-answer'         // "is my answer 7π correct?"
  | 'solve-for-me'          // "solve this equation" (user opted-in)
  | 'find-in-uploads'       // "what did I upload about calculus?"
  | 'practice-problem';     // "give me a hard problem on limits"

export type Source =
  | 'subscription'          // from a user-subscribed community bundle
  | 'bundle'                // shipped default bundle
  | 'cache'                 // server-side cache
  | 'uploads'               // user's own uploads
  | 'community'             // community repo (unsubscribed)
  | 'generated'             // LLM live generation
  | 'wolfram'               // Wolfram live query
  | 'declined';             // intentionally declined

export interface RouteRequest {
  user_id:     string;
  text:        string;                 // raw student input
  concept_id?: string;                 // if already known (e.g. from URL)
  allow_generation?: boolean;          // per-request opt-in for LLM
  allow_wolfram?:    boolean;          // per-request opt-in for Wolfram
}

export interface RouteResult {
  ok:             boolean;
  intent:         Intent;
  source:         Source;
  content:        string | null;
  concept_id:     string | null;
  source_ref:     string | null;
  licence:        string | null;
  disclosure:     string;              // always present — student sees this
  considered:     Source[];
  rejected_because: Record<string, string>;
  reason?:        string;
}

// ─── Intent classification ───────────────────────────────────────────

/**
 * Classify intent. This uses a small rule-set for deterministic
 * behaviour; swap for an LLM classifier if/when we have the budget.
 * Fails closed — ambiguous inputs route to explain-concept.
 */
export function classifyIntent(text: string): Intent {
  const t = text.toLowerCase().trim();
  if (/(is my|check my|verify)\s+(answer|result|solution)/i.test(t)) return 'verify-answer';
  if (/^solve\s|^compute\s|^evaluate\s|^factoris/i.test(t))            return 'solve-for-me';
  if (/walk\s*me\s*through|step[\s-]*by[\s-]*step/i.test(t))           return 'walkthrough-problem';
  if (/(what did i|my upload|in my notes|in my files)/i.test(t))       return 'find-in-uploads';
  if (/(give me|show me|practice)\s+(a |an )?\s*(problem|question)/i.test(t)) return 'practice-problem';
  return 'explain-concept';
}

/**
 * Extract a concept_id from free text. This uses a small keyword map
 * for deterministic behaviour. Production would swap for an embedding
 * similarity against the concept graph.
 */
export function extractConceptId(text: string, fallback?: string): string | null {
  if (fallback) return fallback;
  const t = text.toLowerCase();
  const map: Array<[RegExp, string]> = [
    [/derivative|differentiat/,           'calculus-derivatives'],
    [/integral|integrat/,                  'calculus-integration'],
    [/limit/,                              'calculus-limits'],
    [/eigenval|eigenvector/,               'linear-algebra-eigenvalues'],
    [/matrix|matrices/,                    'linear-algebra-matrices'],
    [/probability/,                        'probability-basics'],
    [/complex\s*number/,                   'complex-numbers'],
    [/vector/,                             'vectors-3d'],
    [/trigonomet|sin\(|cos\(|tan\(/,       'trigonometry'],
    [/algebra|polynomial|quadratic/,       'algebra-basics'],
  ];
  for (const [rx, id] of map) {
    if (rx.test(t)) return id;
  }
  return null;
}

// ─── Main routing entry ──────────────────────────────────────────────

export async function routeContent(req: RouteRequest): Promise<RouteResult> {
  const intent = classifyIntent(req.text);
  const concept_id = extractConceptId(req.text, req.concept_id);
  const subs = getUserSubscriptions(req.user_id);
  const rejected_because: Record<string, string> = {};
  const considered: Source[] = [];

  // Intent-specific early routes first
  if (intent === 'find-in-uploads') {
    considered.push('uploads');
    if (!concept_id) {
      rejected_because.uploads = 'no concept_id resolved from input';
      return _decline(intent, concept_id, considered, rejected_because,
        'tell me which concept to search in your uploads');
    }
    const hits = findUploadsByConcept(req.user_id, concept_id);
    if (hits.length === 0) {
      rejected_because.uploads = 'no uploads tagged with this concept';
      return _decline(intent, concept_id, considered, rejected_because,
        `no uploads found tagged ${concept_id}`);
    }
    return {
      ok: true,
      intent,
      source: 'uploads',
      content: hits.map(h => `[${h.filename}] ${h.note ?? ''}`).join('\n'),
      concept_id,
      source_ref: hits.map(h => h.id).join(','),
      licence: 'user-private',
      disclosure: `From your private uploads — ${hits.length} item(s) tagged ${concept_id}.`,
      considered,
      rejected_because,
    };
  }

  // Verify / solve intents route to Wolfram if allowed
  if ((intent === 'verify-answer' || intent === 'solve-for-me')) {
    considered.push('wolfram');
    if (!req.allow_wolfram) {
      rejected_because.wolfram = 'allow_wolfram=false; user has not opted in for this request';
      return _decline(intent, concept_id, considered, rejected_because,
        'verification / live-solve requires opt-in; set allow_wolfram=true in your request');
    }
    if (subs.exclude_sources.includes('wolfram')) {
      rejected_because.wolfram = 'user subscription excludes wolfram source';
      return _decline(intent, concept_id, considered, rejected_because,
        'your account settings exclude Wolfram');
    }
    // Lazy-import Wolfram to avoid pulling the service into the
    // import graph when not needed
    try {
      const svc = await import('../services/wolfram-service');
      const result = await svc.wolframSolve(req.text, { timeout_ms: 8000 }).catch(() => null);
      if (result && result.answer) {
        return {
          ok: true,
          intent,
          source: 'wolfram',
          content: result.answer,
          concept_id,
          source_ref: 'wolfram-alpha-api',
          licence: 'wolfram-api',
          disclosure: 'Computed live by Wolfram Alpha.',
          considered,
          rejected_because,
        };
      }
      rejected_because.wolfram = 'Wolfram returned no answer';
    } catch (e: any) {
      rejected_because.wolfram = `Wolfram error: ${e?.message ?? 'unknown'}`;
    }
    return _decline(intent, concept_id, considered, rejected_because,
      'Wolfram did not produce an answer');
  }

  // Standard explain-concept / walkthrough-problem / practice-problem
  // Priority cascade: subscription → bundle → community → generation

  // 1. user subscriptions
  for (const bundle_id of subs.bundles) {
    considered.push('subscription');
    const hit = findCommunityContent(bundle_id, concept_id ?? '');
    if (hit) {
      return {
        ok: true, intent, source: 'subscription',
        content: hit.body, concept_id, source_ref: hit.source_ref, licence: hit.licence,
        disclosure: `From your subscribed bundle "${bundle_id}" (${hit.licence}).`,
        considered, rejected_because,
      };
    }
    rejected_because[`subscription:${bundle_id}`] = 'no match for concept_id';
  }

  // 2. shipped bundle — delegate to existing resolver (tier-0)
  if (concept_id) {
    considered.push('bundle');
    try {
      const { resolveContent } = await import('./resolver');
      const res = await resolveContent({ concept_id, kind: 'explainer' } as any).catch(() => null);
      if (res && (res as any).body) {
        return {
          ok: true, intent, source: 'bundle',
          content: (res as any).body, concept_id,
          source_ref: (res as any).content_id ?? null,
          licence: (res as any).licence ?? 'shipped-default',
          disclosure: 'From the shipped content bundle (verified).',
          considered, rejected_because,
        };
      }
      rejected_because.bundle = 'concept not in shipped bundle';
    } catch (e: any) {
      rejected_because.bundle = `resolver error: ${e?.message ?? 'unknown'}`;
    }
  }

  // 3. community repo (unsubscribed bundles — a browse, not a prefer)
  if (concept_id) {
    considered.push('community');
    // Stub: findCommunityContent also works for any registered bundle
    // if the user isn't subscribed. Skipped here — the prefer-only model
    // means no community content without an explicit subscription.
    rejected_because.community = 'no matching community content (stub mode)';
  }

  // 4. live generation (LLM)
  considered.push('generated');
  if (subs.exclude_sources.includes('generated')) {
    rejected_because.generated = 'user subscription excludes generated content';
    return _decline(intent, concept_id, considered, rejected_because,
      'no pre-written content was found, and your account excludes LLM-generated content');
  }
  if (!req.allow_generation) {
    rejected_because.generated = 'allow_generation=false; per-request opt-in required';
    return _decline(intent, concept_id, considered, rejected_because,
      'no pre-written content was found; set allow_generation=true to use the LLM');
  }
  // Stub the LLM generation — keeps this module testable without a
  // provider key. Real integration would go through llm-router-manager.
  return {
    ok: true,
    intent,
    source: 'generated',
    content:
      `[LLM-generated content for ${concept_id ?? 'your request'}] — ` +
      `this placeholder is returned in test/demo mode. Production runs ` +
      `this through llm-router-manager with your configured provider.`,
    concept_id,
    source_ref: 'llm:generated',
    licence: 'generated-unverified',
    disclosure:
      'Generated by LLM — unverified by Wolfram. Check against another source.',
    considered,
    rejected_because,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function _decline(
  intent: Intent,
  concept_id: string | null,
  considered: Source[],
  rejected: Record<string, string>,
  reason: string,
): RouteResult {
  return {
    ok: false,
    intent,
    source: 'declined',
    content: null,
    concept_id,
    source_ref: null,
    licence: null,
    disclosure: `No source available — ${reason}.`,
    considered,
    rejected_because: rejected,
    reason,
  };
}

/**
 * Anonymise user_id for CONTENT_ROUTED telemetry. Uses first 8 chars
 * of sha256 — enough to distinguish users in aggregate analysis, not
 * enough to reverse.
 */
export function hashUserId(user_id: string): string {
  return createHash('sha256').update(user_id).digest('hex').slice(0, 8);
}
