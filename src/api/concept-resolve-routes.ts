/**
 * src/api/concept-resolve-routes.ts
 *
 *   GET /api/concepts/resolve?topic=<label>&q=<question text>
 *
 * Turns a practice question into the concept whose lesson is worth opening.
 *
 * ── Why this exists ─────────────────────────────────────────────────────
 *
 * "Explore this concept" on a practice question pointed at `/topic/<label>`
 * rather than `/lesson/<concept>`, and the code said why: a PYQ carries
 * `topic: "Linear Algebra"` — a display label — and no concept id. There is no
 * `linear-algebra` concept to open, so linking straight to a lesson would have
 * manufactured a dead end.
 *
 * The topic page renders prose. The interactive widgets live on the LESSON
 * page, because `InteractiveSidecar` is mounted inside `AtomCardRenderer` and
 * the topic page does not use it. So the honest-but-limited link also meant
 * "Explore" never reached a single slider, animation, or walkthrough.
 *
 * This closes it without faking anything: the topic label normalises onto the
 * concept graph's own topic key, and among that topic's concepts we pick one
 * whose lesson will actually reward the trip. When nothing resolves, the
 * caller keeps the topic-page link — the dead end the original comment refused
 * to create is still refused here.
 *
 * ── Ranking, in order ───────────────────────────────────────────────────
 *
 *   1. The question text names the concept. "Find the eigenvalues of A"
 *      should open eigenvalues, not whichever concept is listed first.
 *   2. The concept's lesson has interactive widgets. Between two equally
 *      plausible concepts, send the student to the one that moves.
 *   3. Stable order within the topic, so the same question always resolves
 *      the same way.
 *
 * Every response says WHY it matched, so a wrong-looking link is diagnosable
 * from the payload rather than by reading this file.
 */

import { ServerResponse } from 'http';
import type { ParsedRequest, RouteHandler } from '../lib/route-helpers';
import { sendJSON } from '../lib/route-helpers';
import { ALL_CONCEPTS } from '../constants/concept-graph';
import { loadConceptAtoms } from '../content/atom-loader';

interface RouteDefinition {
  method: string;
  path: string;
  handler: RouteHandler;
}

export type MatchReason = 'question-text' | 'topic-with-interactives' | 'topic-first' | 'none';

export interface ConceptResolution {
  concept_id: string | null;
  concept_name: string | null;
  /** Distinct interactive kinds the concept's lesson will render. */
  interactive_kinds: string[];
  match: MatchReason;
  /** Where to send the student when concept_id is null. Never a dead end. */
  fallback_route: string;
}

export interface ConceptCandidate {
  id: string;
  name: string;
  topic: string;
  interactive_kinds: string[];
}

/** `"Linear Algebra"` and `linear-algebra` are the same topic. */
export function normaliseTopic(topic: string): string {
  return topic
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Words from a concept id worth matching against a question.
 *
 * Short fragments are dropped: `svd` is meaningful, but two-letter noise from
 * a hyphenated id would match almost any sentence and make the "question named
 * it" signal worthless.
 */
export function conceptKeywords(conceptId: string): string[] {
  return conceptId
    .split('-')
    .map((w) => w.toLowerCase())
    .filter((w) => w.length >= 3);
}

/**
 * Does the text use this word?
 *
 * Word-boundary matched, not substring. A plain `includes` found "normal"
 * inside "orthonormal" and resolved "Apply Gram-Schmidt to obtain an
 * orthonormal basis" to `jordan-normal-form` — a link labelled with the wrong
 * concept, next to the question, in front of an audience.
 *
 * The trailing `\\w*` allows the plural and inflected forms the stem is meant
 * to catch ("eigenvalue" → "eigenvalues", "determinant" → "determinants")
 * while still requiring the match to START at a word boundary.
 */
function mentions(haystack: string, word: string): boolean {
  const stem = word.replace(/(ies|es|s)$/, '');
  return new RegExp(`\\b${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*`).test(haystack);
}

/** How many of a concept's keywords the question uses. */
function matchedKeywordCount(questionText: string, conceptId: string): number {
  const haystack = questionText.toLowerCase();
  return conceptKeywords(conceptId).filter((w) => mentions(haystack, w)).length;
}

/** True when the question uses every keyword the concept has. */
function isFullMatch(questionText: string, conceptId: string): boolean {
  const words = conceptKeywords(conceptId);
  return words.length > 0 && matchedKeywordCount(questionText, conceptId) === words.length;
}

/**
 * Does the question name this concept?
 *
 * Two ways to qualify, and the second one matters more than it looks:
 *
 *   1. **Every keyword appears.** "Find the eigenvalues" names `eigenvalues`.
 *      Requiring all of them stops `linear-transformations` from matching a
 *      question that merely says "linear".
 *   2. **One keyword appears and it is unique to this concept within the
 *      topic.** "What is the rank of this matrix?" names `rank-nullity` as
 *      surely as if it had said both words, because nothing else in linear
 *      algebra is the rank concept. Without this rule that question fell
 *      through to a generic topic fallback and the link read "Explore
 *      Determinants" on a rank problem — a mismatch an audience notices.
 *
 * `distinctiveWords` is the set of keywords owned by exactly one concept in
 * the topic, computed by the caller because it depends on the candidate set.
 */
export function questionNamesConcept(
  questionText: string,
  conceptId: string,
  distinctiveWords?: Set<string>,
): boolean {
  const haystack = questionText.toLowerCase();
  const words = conceptKeywords(conceptId);
  if (words.length === 0) return false;
  if (words.every((w) => mentions(haystack, w))) return true;
  if (!distinctiveWords) return false;
  return words.some((w) => distinctiveWords.has(w) && mentions(haystack, w));
}

/** Keywords owned by exactly one concept in the candidate set. */
export function distinctiveKeywords(candidates: ConceptCandidate[]): Set<string> {
  const owners = new Map<string, Set<string>>();
  for (const c of candidates) {
    for (const w of conceptKeywords(c.id)) {
      if (!owners.has(w)) owners.set(w, new Set());
      owners.get(w)!.add(c.id);
    }
  }
  const out = new Set<string>();
  for (const [w, ids] of owners) if (ids.size === 1) out.add(w);
  return out;
}

/**
 * Pick the concept whose lesson is worth opening. Pure — the caller supplies
 * the candidate set, so the ranking is testable without a content module.
 */
export function resolveConcept(input: {
  topic: string;
  questionText?: string;
  candidates: ConceptCandidate[];
}): ConceptResolution {
  const key = normaliseTopic(input.topic);
  const fallback_route = `/topic/${encodeURIComponent(input.topic)}`;
  const inTopic = input.candidates.filter((c) => normaliseTopic(c.topic) === key);

  if (inTopic.length === 0) {
    return {
      concept_id: null,
      concept_name: null,
      interactive_kinds: [],
      match: 'none',
      fallback_route,
    };
  }

  const hit = (c: ConceptCandidate, match: MatchReason): ConceptResolution => ({
    concept_id: c.id,
    concept_name: c.name,
    interactive_kinds: c.interactive_kinds,
    match,
    fallback_route,
  });

  // 1. The question names it. Among several named concepts prefer the one with
  //    interactives, then the longest id — `linear-transformations` beats
  //    `linear-independence` on a question that names both only if it is the
  //    more specific match.
  const q = (input.questionText ?? '').trim();
  if (q) {
    const distinctive = distinctiveKeywords(inTopic);
    const named = inTopic.filter((c) => questionNamesConcept(q, c.id, distinctive));
    if (named.length > 0) {
      // Specificity before interactives. "Find the trace of the product AB"
      // fully names `trace` and only distinctively names one word of
      // `inner-product-spaces`; ranking by widget count first picked the
      // latter and labelled a trace question with the wrong concept. A lesson
      // that moves is a tiebreak, never a reason to answer the wrong question.
      named.sort(
        (a, b) =>
          Number(isFullMatch(q, b.id)) - Number(isFullMatch(q, a.id)) ||
          matchedKeywordCount(q, b.id) - matchedKeywordCount(q, a.id) ||
          b.interactive_kinds.length - a.interactive_kinds.length ||
          b.id.length - a.id.length ||
          a.id.localeCompare(b.id),
      );
      return hit(named[0], 'question-text');
    }
  }

  // 2. Nothing named — send them somewhere that moves.
  const interactive = inTopic
    .filter((c) => c.interactive_kinds.length > 0)
    .sort(
      (a, b) => b.interactive_kinds.length - a.interactive_kinds.length || a.id.localeCompare(b.id),
    );
  if (interactive.length > 0) return hit(interactive[0], 'topic-with-interactives');

  // 3. The topic exists but nothing in it has widgets. Still a real lesson.
  return hit([...inTopic].sort((a, b) => a.id.localeCompare(b.id))[0], 'topic-first');
}

/** Interactive kinds authored in a concept's atoms. Cached by the atom loader. */
async function interactiveKindsFor(conceptId: string): Promise<string[]> {
  try {
    const atoms = await loadConceptAtoms(conceptId);
    const kinds = new Set<string>();
    for (const a of atoms) {
      const m = a.content.match(/```interactive-spec\s*\n([\s\S]*?)```/);
      if (!m) continue;
      try {
        const kind = (JSON.parse(m[1]) as { kind?: string }).kind;
        // An unparseable spec renders as nothing, so it must not count — that
        // is how a link promises an interactive and delivers a blank.
        if (typeof kind === 'string') kinds.add(kind);
      } catch {
        /* not a usable widget */
      }
    }
    return [...kinds].sort();
  } catch {
    return [];
  }
}

/** Candidate cache: the corpus is on disk and does not change between requests. */
let _candidates: ConceptCandidate[] | null = null;
async function candidatesForTopic(topicKey: string): Promise<ConceptCandidate[]> {
  if (!_candidates) {
    const nodes = ALL_CONCEPTS.filter((c) => normaliseTopic(c.topic) === topicKey);
    _candidates = await Promise.all(
      nodes.map(async (c) => ({
        id: c.id,
        name: (c as { name?: string }).name ?? c.id.replace(/-/g, ' '),
        topic: c.topic,
        interactive_kinds: await interactiveKindsFor(c.id),
      })),
    );
  }
  return _candidates.filter((c) => normaliseTopic(c.topic) === topicKey);
}

/** Test-only: drop the cache so a fixture corpus is re-read. */
export function __resetConceptCacheForTests(): void {
  _candidates = null;
}

async function handleResolve(req: ParsedRequest, res: ServerResponse): Promise<void> {
  const topic = req.query?.get('topic') ?? '';
  const questionText = req.query?.get('q') ?? '';
  if (!topic.trim()) {
    sendJSON(res, {
      concept_id: null,
      concept_name: null,
      interactive_kinds: [],
      match: 'none',
      fallback_route: '/topics',
    } satisfies ConceptResolution);
    return;
  }

  try {
    const candidates = await candidatesForTopic(normaliseTopic(topic));
    sendJSON(res, resolveConcept({ topic, questionText, candidates }));
  } catch (err) {
    // A resolver failure must not break the practice page. The caller keeps
    // its existing topic link, which is exactly the pre-change behaviour.
    console.warn(`[concept-resolve] failed for "${topic}": ${(err as Error).message}`);
    sendJSON(res, {
      concept_id: null,
      concept_name: null,
      interactive_kinds: [],
      match: 'none',
      fallback_route: `/topic/${encodeURIComponent(topic)}`,
    } satisfies ConceptResolution);
  }
}

export const conceptResolveRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/api/concepts/resolve', handler: handleResolve },
];
