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
import { findUploadsByConcept, userHasUploads } from './uploads';
import { classifyByRules, classifyIntent as classifyIntentAsync } from './intent-classifier';
import type { Intent } from './intent-classifier';
import type { RouteRequest, RouteResult, Source } from './content-types';

// Re-export for backward compatibility — callers may import from this module.
// New code should import from '@/content' (the index) for the consolidated surface.
export type { Intent, RouteRequest, RouteResult, Source };

// ─── Source priority and types ────────────────────────────────────────
//
// Single source of truth for Intent lives in intent-classifier.ts.
// Single source of truth for Source / RouteRequest / RouteResult lives in
// content-types.ts. Both are re-exported above.


// ─── Intent classification ───────────────────────────────────────────

/**
 * Classify intent. Routes through the intent-classifier module which
 * supports both rule-based (default) and LLM-backed (opt-in via
 * VIDHYA_INTENT_CLASSIFIER=llm env var) classification.
 *
 * Re-exported here for backward compatibility with callers importing
 * classifyIntent from src/content/router.
 */
export function classifyIntent(text: string): Intent {
  return classifyByRules(text);
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

async function _routeContentImpl(req: RouteRequest): Promise<RouteResult> {
  const intent = await classifyIntentAsync(req.text);
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
  // Priority cascade: subscription → library → bundle → community → generation

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

  // 2. content-library — seeds + runtime additions, ranked by
  //    preferred_difficulty / preferred_exam_id when supplied
  if (concept_id) {
    considered.push('library');
    try {
      const lib = await import('../modules/content-library');
      const exact = lib.getEntry(concept_id);
      if (exact) {
        // For "explain" + "walkthrough" intents, prefer the explainer body
        // For "practice-problem" intent, prefer the worked example as the
        // problem prompt
        const prefer_worked = intent === 'practice-problem'
          || intent === 'walkthrough-problem';
        const body = (prefer_worked && exact.worked_example_md)
          ? exact.worked_example_md
          : exact.explainer_md;
        const variant_label = prefer_worked && exact.worked_example_md
          ? 'worked example'
          : 'explainer';
        return {
          ok: true, intent, source: 'library',
          content: body, concept_id,
          source_ref: `library:${exact.source}:${exact.concept_id}`,
          licence: exact.licence,
          disclosure: exact.source === 'seed'
            ? `From the built-in content library — ${variant_label} (${exact.licence}).`
            : `From the content library, ${exact.source}-contributed — ${variant_label} (${exact.licence}).`,
          considered, rejected_because,
        };
      }
      // No exact match. Try a personalised find — same concept_id is the
      // primary key, so this only finds matches by tag/exam if the caller
      // didn't pass a concept_id at all (we already gated on concept_id
      // above). Skip ranked lookup for now — exact match is the contract.
      rejected_because.library = `no library entry for concept_id='${concept_id}'`;
    } catch (e: any) {
      rejected_because.library = `library read failed: ${e?.message ?? 'unknown'}`;
    }
  }

  // 3. shipped bundle — legacy fallback for concepts the library doesn't carry
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

  // 4. community repo (unsubscribed bundles — a browse, not a prefer)
  if (concept_id) {
    considered.push('community');
    // Stub: findCommunityContent also works for any registered bundle
    // if the user isn't subscribed. Skipped here — the prefer-only model
    // means no community content without an explicit subscription.
    rejected_because.community = 'no matching community content (stub mode)';
  }

  // 5. live generation (LLM)
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

/**
 * Main entry — classify intent, select source, emit CONTENT_ROUTED
 * signal on the in-process signal bus (so subscribers like telemetry
 * and feedback-manager can react).
 *
 * Signal payload uses hashed user_id (8-char sha256 prefix) — enough
 * to aggregate per-user in cohort analysis, not enough to deanonymise.
 */
export async function routeContent(req: RouteRequest): Promise<RouteResult> {
  const result = await _routeContentImpl(req);

  // ── Upload blending post-filter (ER-D8 + P2A) ────────────────────────
  // After primary route, surface user uploads alongside if the concept matches.
  // Fast-path: skip entirely if user has zero uploads (the common case).
  // Skipped when intent is already 'find-in-uploads' (uploads are the primary
  // result), or when the route declined.
  if (result.ok && result.intent !== 'find-in-uploads' && result.concept_id && userHasUploads(req.user_id)) {
    const blended = findUploadsByConcept(req.user_id, result.concept_id);
    if (blended.length > 0) {
      result.blended_uploads = blended.map(u => ({
        id: u.id,
        filename: u.filename,
        note: u.note,
      }));
      // Surface in the disclosure so the student knows their uploads were considered.
      result.disclosure = `${result.disclosure} (Plus ${blended.length} from your uploads.)`;
    }
  }

  // Fire-and-forget signal; lazy-load to avoid hard coupling at startup
  try {
    const { publish } = await import('../events/signal-bus');
    publish('content-routed', 'content-router', {
      user_id_hash: hashUserId(req.user_id),
      concept_id: result.concept_id,
      intent: result.intent,
      chosen_source: result.source,
      session_mode: req.session_mode ?? 'knowledge',
      blended_uploads_count: result.blended_uploads?.length ?? 0,
      rejected_because: result.rejected_because,
    });
  } catch { /* bus unavailable — signal lost, no functional impact */ }

  // Debug trace (ER-D4): when VIDHYA_CONTENT_DEBUG=true, log to console.
  // Reuses the same data path as production telemetry for parity.
  if (process.env.VIDHYA_CONTENT_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.log('[content-router]', {
      intent: result.intent,
      source: result.source,
      concept_id: result.concept_id,
      considered: result.considered,
      rejected_because: result.rejected_because,
      blended_uploads: result.blended_uploads?.length ?? 0,
      session_mode: req.session_mode ?? 'knowledge',
    });
  }

  return result;
}
