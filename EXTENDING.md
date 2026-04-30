# Extending the Content Module

This is the map for engineers extending the content cascade. Read it before
opening any file.

The content module has four extension contracts. All live under `src/content/`
or `src/verification/`. Each has a TypeScript interface, a contract test
function, and a one-line registration hook.

| Contract | What it does | File | Contract test |
|---|---|---|---|
| `AnswerVerifier` | Verifies math ANSWERS (correctness) | `src/verification/verifiers/types.ts` | `runAnswerVerifierContract` |
| `ContentVerifier` | Verifies CONTENT QUALITY (clarity, provenance) | `src/content/verifiers/types.ts` | `runContentVerifierContract` |
| `CadenceStrategy` | Knowledge vs. exam-prep cadence | `src/content/cadence.ts` | `runCadenceStrategyContract` |
| `PedagogyReviewer` | Async quality gate for generated content | `src/content/pedagogy.ts` | `runPedagogyReviewerContract` |

Two different "verifier" concepts: **AnswerVerifier** checks whether a math
answer is correct (Wolfram, SymPy, LLM consensus). **ContentVerifier** checks
whether delivered content meets quality bars (clarity, syllabus alignment).
Don't confuse them.

## Time to first extension

Target: **<20 minutes** for an internal engineer adding a new verifier.
Pre-DX baseline: 75 minutes.

Measure: time from "git pull" to "first verifier passes contract test."

## Adding a new AnswerVerifier (Tier 4+)

Tier 1-3 are reserved for the built-in cascade (RAG → LLM dual-solve →
Wolfram). Tier 4+ slots accept new verifiers via `registerVerifier()` with
zero orchestrator edits.

Concrete walkthrough — adding a SymPy cross-check at Tier 4:

1. Create `src/verification/verifiers/sympy-crosscheck.ts`:

   ```ts
   import type { AnswerVerifier, AnswerVerifierResult } from './types';

   export const sympyCrossCheck: AnswerVerifier = {
     name: 'sympy-crosscheck',
     tier: 4,
     async verify(problem, answer): Promise<AnswerVerifierResult> {
       // Your verification logic here. Return early on timeout — never throw.
       return { agrees: true, confidence: 0.85 };
     },
     async healthCheck() { return true; },
   };

   export default sympyCrossCheck;
   ```

2. Register at server bootstrap:

   ```ts
   import { sympyCrossCheck } from './verification/verifiers/sympy-crosscheck';
   orchestrator.registerVerifier(sympyCrossCheck);
   ```

3. Write the contract test:

   ```ts
   import { describe } from 'vitest';
   import { runAnswerVerifierContract } from '@/verification/verifiers/contract';
   import { sympyCrossCheck } from '../sympy-crosscheck';

   describe('sympyCrossCheck', () => {
     runAnswerVerifierContract(sympyCrossCheck);
   });
   ```

4. Run `npm run test:content`. Six contract tests + your impl-specific tests
   should pass.

That's it. No orchestrator edits. No constructor changes. No coupling to
Tier 1-3 logic.

## Adding a new ContentVerifier

Distinct from AnswerVerifier. ContentVerifier checks quality of delivered
content (Tier 2/3 generated material) before it lands in cache.

```ts
// src/content/verifiers/clarity-check.ts
import type { ContentVerifier, ContentVerifierResult } from './types';

export const clarityCheck: ContentVerifier = {
  name: 'clarity-check',
  tier: 1,
  async verify(content): Promise<ContentVerifierResult> {
    return { passed: true, score: 0.9 };
  },
  async healthCheck() { return true; },
};
```

See `src/verification/verifiers/example.ts` for `AlwaysTrueVerifier` — a
working live example that shows the AnswerVerifier shape end to end.

## Adding a new CadenceStrategy

CadenceStrategy is a post-filter on routed content. Use it to reorder
or trim results based on `session_mode` (knowledge / exam-prep / revision)
and `exam_proximity_days`.

```ts
// src/content/cadence-exam-proximity.ts
import type { CadenceStrategy, CadenceItem, CadenceContext } from './cadence';

export const examProximity: CadenceStrategy = {
  name: 'exam-proximity',
  appliesTo(ctx) { return ctx.mode === 'exam-prep'; },
  selectContent(items, ctx) {
    if (!ctx.examProximityDays || ctx.examProximityDays > 30) return items;
    // Within 30 days: sort by examRelevance descending, drop intro difficulty
    return items
      .filter(i => i.difficulty !== 'intro')
      .sort((a, b) => (b.examRelevance ?? 0) - (a.examRelevance ?? 0));
  },
};
```

Strategies must be deterministic (same inputs → same output) — the contract
test enforces this.

## Adding a new PedagogyReviewer

PedagogyReviewer runs **async, post-delivery**. The student never waits on it.
Score is written back to the RAG cache; bad content gets demoted on next request.

The interface guarantees `review()` never throws. A failed reviewer must
not affect content delivery.

```ts
// src/content/pedagogy-gemini.ts
import type { PedagogyReviewer, PedagogyResult } from './pedagogy';

export const geminiReviewer: PedagogyReviewer = {
  name: 'gemini-pedagogy',
  failThreshold: 0.6,
  async review(content): Promise<PedagogyResult | null> {
    // Call LLM. On timeout return null (caller swallows null and logs).
    return null; // placeholder
  },
  async healthCheck() { return true; },
};
```

## Debug trace

Set `VIDHYA_CONTENT_DEBUG=true` to see every router decision logged to console:

```
[content-router] {
  intent: 'explain-concept',
  source: 'cache',
  concept_id: 'calculus-derivatives',
  considered: ['cache', 'bundle'],
  rejected_because: {},
  blended_uploads: 0,
  session_mode: 'knowledge'
}
```

Production telemetry stays unaffected — debug output is purely additive.

## Isolated test runner

```bash
npm run test:content
```

Runs only the content + verification suites (~3s feedback) instead of the
full 654-test suite (~45s).

## File-level reference

```
src/content/
├── content-types.ts         RouteRequest, RouteResult, ResolvedContent, SessionMode
├── blog-types.ts            (Blog/marketing types — DO NOT confuse with content-types)
├── intent-classifier.ts     Single source of truth for Intent enum
├── router.ts                routeContent() — primary entry, post-filter blending
├── resolver.ts              4-tier cascade (Tier 0 bundle → Tier 3 Wolfram)
├── uploads.ts               findUploadsByConcept, userHasUploads (cached)
├── cadence.ts               CadenceStrategy interface
├── pedagogy.ts              PedagogyReviewer interface (async post-delivery)
├── telemetry.ts             CONTENT_ROUTED signal + getTierMissRate24h
├── cadence-contract.ts      runCadenceStrategyContract
├── pedagogy-contract.ts     runPedagogyReviewerContract
└── verifiers/
    ├── types.ts             ContentVerifier interface
    └── contract.ts          runContentVerifierContract

src/verification/
├── tiered-orchestrator.ts   3-tier cascade + registerVerifier(Tier 4+)
├── verifiers/
│   ├── types.ts             AnswerVerifier interface
│   ├── contract.ts          runAnswerVerifierContract
│   ├── example.ts           AlwaysTrueVerifier — live reference
│   ├── wolfram.ts           Tier 3 — Wolfram Alpha
│   ├── sympy.ts             Tier 4-eligible — SymPy
│   └── llm-consensus.ts     Tier 2 — LLM dual-solve
```

## Common pitfalls

- **Don't import from `src/content/types.ts`** — that file no longer exists.
  It was renamed to `blog-types.ts`. Content types are in `content-types.ts`.
- **Don't define `Intent` in your file.** Import from `intent-classifier.ts`
  or re-export from `src/content/index.ts`. Single source of truth.
- **Don't make PedagogyReviewer.review() throw.** It must return `null` on
  any failure. The contract test enforces this.
- **Don't register Tier 1-3 verifiers.** `registerVerifier()` rejects them.
  Tier 1-3 are reserved for the built-in cascade.
- **Don't synchronously call PedagogyReviewer in the delivery path.** It's
  async post-delivery by design. Sync placement was rejected in eng review
  (ER-D3) because it would 2x student-facing latency.
