# PLAN: Content Module DX Expansion

**Branch:** main  
**Date:** 2026-04-30  
**Skill:** /plan-devex-review  
**Mode:** DX EXPANSION  
**Target TTHW:** <20 min (Champion tier)  
**Current TTHW:** ~75 min (Red Flag tier)

---

## What This Plan Covers

The content module (`src/content/`, `src/verification/`) is the force multiplier for every student-facing capability. Every new verifier, intent class, cadence strategy, or source plugin must be wired through it. Currently, adding any of these takes ~75 minutes of confusion per extension because there are no typed interfaces, no extension docs, and no debug tooling.

This plan makes the content module extensible as a first-class property: typed contracts, scaffold CLI, docs, debug trace, and a measurable TTHW target.

The six capabilities in scope:
1. **High-quality source verification** — Wolfram + SymPy as pluggable verifiers via `VerifierInterface`
2. **User upload blending** — uploads transparently surface alongside primary content when concept matches
3. **Cadence strategies** — `CadenceStrategy` interface for knowledge vs. exam-prep vs. revision modes
4. **Provider-agnostic LLM** — remove hardcoded `gemini-flash-lite`, route through `src/llm/runtime.ts`
5. **Pedagogy review gate** — `PedagogyReviewer` interface quality-gates Tier 2/3 content before delivery
6. **DX scaffolding** — typed extension contracts, scaffold CLI, debug trace, docs

---

## Developer Persona

```
TARGET DEVELOPER PERSONA
========================
Who:       Internal engineer extending the content cascade
Context:   Adding a new verifier (SymPy, WolframAlpha v2), new intent class,
           new cadence strategy (knowledge vs exam mode), new source plugin
Tolerance: 30-60 min to get a new tier wired and tested
Expects:   TypeScript interfaces, clear extension points, test fixtures,
           telemetry hooks, documented tier priority logic
```

---

## Developer Empathy Narrative

> "I open the README. It's inspirational — 2 a.m. student story, four ingredients. I scroll for 'how to extend.' Finds ARCHITECTURE.md link. File doesn't exist. I open `src/content/`. I see `router.ts`, `resolver.ts`, `intent-classifier.ts`, `types.ts`. I open `types.ts` expecting content types. I get BlogPost. Wrong file. I open `router.ts`. Line 1: `// @ts-nocheck`. Yellow flag. I read the 8-tier comment — clear structure. I search for `VerifierInterface`. Nothing. I open `tiered-orchestrator.ts`. Three hardcoded tiers. To add Tier 4, I edit the constructor AND the cascade logic AND the config type. Four files for one verifier. I search for 'register' or 'plugin'. Zero results. I write the SymPy class, touch four files, deploy. The verifier doesn't fire in staging. No logs. I add console.log, redeploy. The verifier fires but the confidence threshold isn't wired. 75 minutes later, it works. I document nothing. The next engineer starts at T+0 again."

*Confirmed accurate by product team.*

---

## Competitive DX Benchmark

| Platform | TTHW | Notable DX choice |
|---|---|---|
| HuggingFace datasets | ~15 min | `DatasetBuilder` ABC, one file to subclass, auto-registered |
| LangChain (TypeScript) | ~25 min | `BaseRetriever` interface, `_getRelevantDocuments()` stub, full examples |
| LlamaIndex | ~30 min | Typed `BaseNodeParser`, CONTRIBUTING.md, integration template repo |
| OpenStax Tutor API | ~2-3 hr | Sparse docs, requires reading source, no interface contracts |
| **This content module (current)** | **~75 min** | No typed extension points, @ts-nocheck, types split across files, LLM stub silently no-ops |
| **This content module (target)** | **<20 min** | VerifierInterface + auto-registry, scaffold CLI, EXTENDING.md, debug trace |

---

## Magical Moment Specification

**The moment:** Engineer runs `npx vidhya-scaffold verifier sympy`, runs `npm run test:content`, sees the verifier fire in the cascade trace, gets a green badge — all in one terminal session without reading source.

**Delivery vehicle:** Scaffold CLI (`npx vidhya-scaffold verifier <name>`)  
**Implementation:** Generates `VerifierInterface` stub + test fixture + auto-registered in `verifiers/index.ts`  
**Required state:** `VerifierInterface` defined, auto-registry in place, `AlwaysTrueVerifier` as live example

---

## Developer Journey Map

```
STAGE           | DEVELOPER DOES                  | FRICTION POINTS               | STATUS
----------------|----------------------------------|-------------------------------|--------
1. Discover     | README → grep for extension docs | No EXTENDING.md, no CONTRIBUTING.md | FIXED: EXTENDING.md linked from README
2. Install      | npm install (standard)          | No isolated content test runner | FIXED: npm run test:content
3. Hello World  | Add first verifier               | No VerifierInterface, 4-file edit, @ts-nocheck | FIXED: VerifierInterface + auto-registry
4. Real Usage   | Add cadence strategy             | No CadenceStrategy, no session_mode | FIXED: CadenceStrategy + session_mode on RouteRequest
5. Debug        | Understand why tier didn't fire  | No debug mode, silent LLM fallback | FIXED: VIDHYA_CONTENT_DEBUG trace + declined_reason
6. Upgrade      | Update callers after API change  | Duplicate Intent type, @ts-nocheck | FIXED: consolidate Intent + remove @ts-nocheck
```

---

## Implementation Decisions

### Decided

| # | Decision | Implementation |
|---|---|---|
| D6 | **EXTENDING.md** — extension map linked from README | `EXTENDING.md` at repo root; maps VerifierInterface, CadenceStrategy, IntentClassifier, SourcePlugin with file paths and 2-line descriptions |
| D7 | **VerifierInterface + auto-registry** | `interface ContentVerifier { name: string; verify(input): Promise<VerifyResult>; healthCheck(): Promise<boolean> }` in `src/verification/verifiers/index.ts`. Auto-discover all exports. Zero orchestrator edits per new verifier. |
| D8 | **CadenceStrategy + session_mode** | `session_mode: 'knowledge' \| 'exam-prep' \| 'revision'` on `RouteRequest`. `CadenceStrategy` interface: `selectContent(results, mode, examProximityDays): ContentItem[]`. Router calls as post-filter. |
| D9 | **VIDHYA_CONTENT_DEBUG cascade trace** | When env var set, router/resolver log each tier decision: name, input, match/skip reason, latency. Zero-cost in production. |
| D10 | **Consolidate Intent type + remove @ts-nocheck** | Single `Intent` export in `src/content/intent-classifier.ts`, re-exported from `src/content/index.ts`. Remove `@ts-nocheck` from `router.ts`. |
| P1 | **AlwaysTrueVerifier example** | `src/verification/verifiers/example.ts` — 25-line toy verifier, auto-registered, covered by unit test. Breaks if interface drifts. |
| P2A | **Upload blending as post-filter** | After primary source resolves, router calls `findUploadsByConcept(concept_id)`. If match, appends upload to result with `source='uploads-blended'`. No intent restriction. |
| P2B | **LLM classifier startup warning** | If `VIDHYA_INTENT_CLASSIFIER=llm` and no LLM key configured: `WARN: VIDHYA_INTENT_CLASSIFIER=llm but no LLM keys found — falling back to rule-based classifier.` |
| P3 | **declined_reason enum on ResolvedContent** | `declined_reason?: 'rag-threshold-not-met' \| 'wolfram-timeout' \| 'wolfram-limit-hit' \| 'generation-disabled' \| 'no-concept-match'`. Each tier sets it on skip. |
| P4 | **JSDoc on all public content types** | `RouteRequest`, `ResolvedContent`, `VerifierInterface`, `CadenceStrategy`, `Intent` enum — each field gets 1-line JSDoc with valid values and examples. |
| P6 | **npm run test:content** | `"test:content": "vitest run src/content/ src/verification/ --reporter=verbose"` in `package.json`. Referenced in EXTENDING.md as canonical dev command. |
| P8 | **Tier-miss rate on /health + TTHW baseline** | Add `content_tier_miss_rate_24h` to `/health` response. Document baseline: "75 min pre-DX, target <20 min" in EXTENDING.md. |

### Also In Scope (from TODO decisions)

| # | Decision | Implementation |
|---|---|---|
| TODO-1 | **Provider-agnostic LLM in resolver.ts** | Remove `import { GoogleGenerativeAI }` from `src/content/resolver.ts`. Route all LLM calls through `src/llm/runtime.ts`. Env var swaps provider. |
| TODO-2 | **PedagogyReviewer interface** | `interface PedagogyReviewer { review(content, rubric): Promise<PedagogyResult> }`. Rubric: accuracy, clarity, difficulty-appropriateness, GATE syllabus alignment. Tier 2/3 content passes through it before delivery. Gemini-backed implementation ships with it. |

### Not in Scope

| Item | Rationale |
|---|---|
| External community docs (GitHub Pages) | Internal tool; EXTENDING.md + inline JSDoc is sufficient |
| Automated codemods for breaking changes | Monorepo at this scale; CHANGELOG section is sufficient |
| Full LLM classifier implementation | Separate PR; startup warning covers the confusion gap today |
| TypeDoc HTML generation | EXTENDING.md + JSDoc IntelliSense covers the use case without a build step |
| DORA metrics / full DX instrumentation | Team is small; tier-miss rate on /health is the right first instrument |

### What Already Exists

- `src/content/telemetry.ts` — `CONTENT_ROUTED` signal (extend to include tier result)
- `src/content/router.ts` — 8-tier priority array (well-structured, just undocumented)
- `src/verification/tiered-orchestrator.ts` — 3-tier cascade (extend to support auto-registry)
- `src/content/intent-classifier.ts` — rule-based classifier (solid, extend with startup warning)
- `src/content/resolver.ts` — `ResolvedContent` type with `source` field (extend with `declined_reason`)
- `src/content/uploads.ts` — `findUploadsByConcept()` (already exists, just not called from router)

---

## Implementation Checklist

```
DX IMPLEMENTATION CHECKLIST
============================
[ ] EXTENDING.md created at repo root, linked from README
[ ] VerifierInterface defined in src/verification/verifiers/index.ts
[ ] Auto-registry: verifiers/index.ts barrel auto-discovers all exports
[ ] AlwaysTrueVerifier example in src/verification/verifiers/example.ts + unit test
[ ] npx vidhya-scaffold verifier <name> generates stub + test fixture
[ ] CadenceStrategy interface defined in src/content/cadence.ts
[ ] session_mode added to RouteRequest type
[ ] Upload blending post-filter in router.ts (findUploadsByConcept after primary resolve)
[ ] VIDHYA_CONTENT_DEBUG env var: cascade trace to console
[ ] LLM classifier startup warning in intent-classifier.ts
[ ] declined_reason added to ResolvedContent with typed enum
[ ] JSDoc on all public types: RouteRequest, ResolvedContent, VerifierInterface, CadenceStrategy, Intent
[ ] Intent type consolidated to single source (intent-classifier.ts), re-exported from content/index.ts
[ ] @ts-nocheck removed from router.ts
[ ] npm run test:content added to package.json
[ ] content_tier_miss_rate_24h added to /health endpoint
[ ] TTHW baseline documented in EXTENDING.md: "75 min pre-DX, target <20 min"
[ ] src/content/types.ts renamed to src/content/blog-types.ts (or new content-types.ts created)
[ ] CHANGELOG.md section added for content module API (RouteRequest, VerifierInterface)
[ ] resolver.ts LLM call routed through src/llm/runtime.ts (GoogleGenerativeAI import removed)
[ ] PedagogyReviewer interface defined in src/content/pedagogy.ts
[ ] Gemini-backed PedagogyReviewer implementation wired into Tier 2/3 content delivery
[ ] PedagogyReviewer test fixtures in src/content/__tests__/pedagogy.test.ts
```

---

## DX Scorecard

```
+====================================================================+
|              DX PLAN REVIEW — SCORECARD                             |
+====================================================================+
| Dimension            | Score  | Prior  | Trend  |
|----------------------|--------|--------|--------|
| Getting Started      |  9/10  |  2/10  |  +7 ↑  |
| API/CLI/SDK          |  8/10  |  3/10  |  +5 ↑  |
| Error Messages       |  8/10  |  2/10  |  +6 ↑  |
| Documentation        |  8/10  |  1/10  |  +7 ↑  |
| Upgrade Path         |  7/10  |  2/10  |  +5 ↑  |
| Dev Environment      |  8/10  |  3/10  |  +5 ↑  |
| Community            |  6/10  |  5/10  |  +1 ↑  |
| DX Measurement       |  7/10  |  0/10  |  +7 ↑  |
+--------------------------------------------------------------------+
| TTHW                 | <20 min | 75 min | -55m ↓ (improvement)    |
| Competitive Rank     | Champion (<20 min)                           |
| Magical Moment       | scaffold CLI (npx vidhya-scaffold verifier)  |
| Product Type         | Internal Platform / Extension API            |
| Mode                 | DX EXPANSION                                 |
| Overall DX           |  7.6/10 | 2.3/10 | +5.3 ↑                  |
+====================================================================+
| DX PRINCIPLE COVERAGE                                               |
| Zero Friction         | covered (scaffold CLI, auto-registry)       |
| Learn by Doing        | covered (AlwaysTrueVerifier, test fixture)  |
| Fight Uncertainty     | covered (declined_reason, debug trace)      |
| Opinionated + Escapes | covered (session_mode defaults, override ok)|
| Code in Context       | covered (JSDoc, EXTENDING.md with examples) |
| Magical Moments       | covered (scaffold → green test in 1 session)|
+====================================================================+
```

---

## First-Time Developer Confusion Report (annotated)

```
FIRST-TIME DEVELOPER REPORT
============================
Persona: Internal platform engineer, adding SymPy as Tier 4 verifier

T+0:00  Opens README. Finds EXTENDING.md link. Opens it.                    ✅ FIXED (D6)
T+0:03  Reads VerifierInterface section. Knows exactly what to implement.   ✅ FIXED (D7)
T+0:05  Runs: npx vidhya-scaffold verifier sympy. Gets stub + test file.    ✅ FIXED (D4)
T+0:10  Implements verify() method. Runs: npm run test:content.             ✅ FIXED (P6)
T+0:15  Tests pass. Debug trace shows tier firing with confidence score.    ✅ FIXED (D9)
T+0:20  Pushes. Done.

Total: 20 min. Code written: ~40 lines. Confusion: ~2 min.
```

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 0 | — | — |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 1 | CLEAR | score: 2.3/10 → 7.6/10, TTHW: 75min → <20min |

**VERDICT:** DX Review CLEAR. Eng review required before implementation.
