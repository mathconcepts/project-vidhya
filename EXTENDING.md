# Extending the Content Module

This is the map for engineers extending the content cascade. Read it before
opening any file.

The content module has five extension contracts. Four live under
`src/content/` or `src/verification/`; `MarkingStrategy` lives under
`src/scoring/`. Each has a TypeScript interface, a contract test function,
and a one-line registration hook.

| Contract | What it does | File | Contract test |
|---|---|---|---|
| `AnswerVerifier` | Verifies math ANSWERS (correctness) | `src/verification/verifiers/types.ts` | `runAnswerVerifierContract` |
| `ContentVerifier` | Verifies CONTENT QUALITY (clarity, provenance) | `src/content/verifiers/types.ts` | `runContentVerifierContract` |
| `CadenceStrategy` | Knowledge vs. exam-prep cadence | `src/content/cadence.ts` | `runCadenceStrategyContract` |
| `PedagogyReviewer` | Async quality gate for generated content | `src/content/pedagogy.ts` | `runPedagogyReviewerContract` |
| `MarkingStrategy` | Marks one structured response under an exam's rules | `src/scoring/marking-strategy.ts` | `runMarkingStrategyContract` |

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

## Adding a new MarkingStrategy

A `MarkingStrategy` marks one structured response (an option index, a set of
indices, a numeric value) under one exam's rules. The **strategy id names
the algorithm; the contract row names the numbers** — that split is what
makes an exam with familiar arithmetic a data change instead of a code
change.

Reach for a new strategy only when the arithmetic itself is new. If the new
exam just has different negatives or different mark values, add a row to
`assessment_contracts` and stop — no code. If it needs a computation no
registered strategy performs (JEE Advanced's partial-marking matrix is the
worked example, in
`docs/designs/2026-08-27-assessment-contract-jee-advanced-check.md`), it
needs one strategy, and never a fork of `GateDeterministicScorer`.

1. Create `src/scoring/marking-strategies/jee-adv.ts`:

   ```ts
   import type {
     MarkingStrategy, MarkingStrategyItem, MarkingStrategyResponse,
   } from '../marking-strategy';
   import type { GradeResult } from '../../core/interfaces';

   export const jeeAdvStrategy: MarkingStrategy = {
     id: 'jee_adv',
     description: 'Flat MCQ negative; MSQ partial-marking matrix by miss-count.',
     supportedKinds: ['mcq', 'msq', 'nat'],

     async grade(
       item: MarkingStrategyItem,
       response: MarkingStrategyResponse,
       params?: Record<string, unknown>,
     ): Promise<GradeResult> {
       if (!this.supportedKinds.includes(item.kind)) {
         // Refuse by name. Never return a fabricated 0 — that is a wrong
         // mark on a student's paper wearing the costume of a valid one.
         throw new Error(
           `marking strategy 'jee_adv' does not grade question kind '${item.kind}'; ` +
           `supported: ${this.supportedKinds.join(', ')}`,
         );
       }
       const marks = Number(params?.marks_correct ?? item.marks);
       const wrong = Number(params?.marks_wrong ?? 0);
       if (response.skipped) {
         return graded(0, marks, false, 'Skipped: no marks awarded or deducted.');
       }
       const correct = response.selectedIndex === item.answerIndex;
       return graded(correct ? marks : wrong, marks, correct, correct ? 'Correct.' : 'Incorrect.');
     },
   };

   function graded(earned: number, max: number, correct: boolean, feedback: string): GradeResult {
     return {
       earned, max, perCriterion: { final: earned },
       feedback, confidence: 1.0, casFinalAnswerCorrect: correct,
     };
   }
   ```

2. Register it. Add one line to `registerBuiltInMarkingStrategies()` in
   `src/scoring/marking-strategy.ts`:

   ```ts
   registerMarkingStrategy(jeeAdvStrategy);
   ```

   Duplicate ids throw at registration rather than letting import order
   decide which implementation silently wins.

3. Write the contract test at
   `src/scoring/__tests__/jee-adv-strategy.test.ts`:

   ```ts
   import { describe } from 'vitest';
   import { runMarkingStrategyContract } from '../marking-strategy-contract';
   import { jeeAdvStrategy } from '../marking-strategies/jee-adv';

   describe('jeeAdvStrategy', () => {
     runMarkingStrategyContract(jeeAdvStrategy, {
       item: { id: 'q1', kind: 'mcq', marks: 3, answerIndex: 2, options: ['a', 'b', 'c', 'd'] },
       params: { marks_correct: 3, marks_wrong: -1 },
       correct: { kind: 'mcq', selectedIndex: 2 },
       wrong: { kind: 'mcq', selectedIndex: 0 },
       skipped: { kind: 'mcq', skipped: true },
       expectedWrongMarks: -1,
       unsupportedKind: 'descriptive',
     });
   });
   ```

   Unlike the other four contracts, this one takes a fixture: a strategy for
   a different exam grades different question kinds, so the contract cannot
   hardcode one item shape. The fixture declares one correct / wrong /
   skipped triple and what a wrong answer must cost — the fact the contract
   exists to pin down.

4. Add the strategy's contract row. `assessment_contracts` is keyed
   `(exam, paper, year)`; `marking` is per question type, each naming a
   strategy and its params:

   ```json
   {"mcq": {"strategy": "jee_adv", "params": {"marks_correct": 3, "marks_wrong": -1}}}
   ```

   A row whose `strategy` nobody registered is refused at resolve time,
   naming the id and what would have worked:

   ```
   marking_strategy 'jee_adv_2027' is not registered; known: gate_2026, jee_adv
   ```

5. Extend the seam-registry entry if you add a new interface or test file.
   The existing entry already covers this seam:

   ```json
   {
     "name": "marking-strategy",
     "interface_file": "src/scoring/marking-strategy.ts",
     "config_source": "supabase/migrations/050_assessment_contracts.sql (assessment_contracts.marking), with src/exams/marking-constants.ts as the compiled DB-less fallback",
     "conformance_test_path": "src/scoring/__tests__/marking-strategy-contract.test.ts"
   }
   ```

   `npm run ci:seam-registry` fails if either path stops resolving.

Two rules that are not negotiable:

- **The numbers live in the contract, never in the strategy.** GATE's are
  compiled once in `src/exams/marking-constants.ts` (the DB-less fallback
  and the generator of migration 050's seed row) and nowhere else — five
  independent statements of the same marking fact is what plan D7 deleted.
- **Refuse, never fabricate.** Params describing rules your strategy cannot
  apply are an error naming the param and its required value, not a
  best-effort grade. A wrong mark is worse than a refusal.

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

src/scoring/
├── marking-strategy.ts           MarkingStrategy interface + registry + gate_2026
├── marking-strategy-contract.ts  runMarkingStrategyContract
└── deterministic-scorer.ts       the arithmetic gate_2026 delegates to

src/exams/
├── marking-constants.ts             the ONE compiled marking truth
└── assessment-contract-loader.ts    DB row → compiled fallback, 60s TTL
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
- **Don't restate a marking number.** GATE's live in
  `src/exams/marking-constants.ts` and are derived everywhere else. A second
  copy is how five of them appeared before plan D7 collapsed them.
- **Don't synchronously call PedagogyReviewer in the delivery path.** It's
  async post-delivery by design. Sync placement was rejected in eng review
  (ER-D3) because it would 2x student-facing latency.
