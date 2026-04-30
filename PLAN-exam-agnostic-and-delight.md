# PLAN: Exam-Agnostic + Customer Delight Pass

**Branch:** main
**Date:** 2026-04-30
**Skill:** /plan-ceo-review
**Origin:** "the portal must be exam agnostic yet I see references to GATE. ensure that all types of hardcoding are removed. Walkthrough all the features and ensure that user centricity is maintained and if not, improve the customer delight experience"

---

## North-Star Principles (apply to every item below)

1. **Compounding visibility.** Every UI surface should help the student feel they are getting better. From the v2.4 design system: serif weight, restrained decoration, signature violet for AI/Tutor.
2. **Frugal layout.** Subtraction beats addition. If a UI element doesn't earn its pixels, cut it. Customer confidence comes from clarity, not chrome.
3. **Exam-agnostic by default.** GATE is one of N exams the platform serves. No hardcoded GATE assumptions in defaults, fallbacks, file names, or branding.

---

## The 23 Cherry-Picked Items

Grouped into phases by impact × effort. Phase 1 ships today. Phases 2-3 become follow-up PRs.

### PHASE 1 — Customer-visible quick wins (~half day, single PR)

Total CC effort: ~4-5 hr. Maximum customer-facing impact, low individual risk.

| # | Item | Effort | Bucket |
|---|---|---|---|
| 1.1 | **Rewrite MarketingLanding for student empathy.** Hero copy + stats strip leads with student outcome ("know exactly the 3 things to study tomorrow") not architecture ("82 concepts mapped"). Keep tech depth in collapsed "For builders" section. | 30 min | 1 |
| 2.2 | **Remove the AI-process spectacle from PracticePage verify.** Replace 3-stage "Checking knowledge base / Running AI / Confirming" animation with: instant result if fast, single subtle progress shimmer if slow (>1.5s). | 30 min | 2 |
| 2.3 | **De-GATE PracticePage strings** (use exam adapter for problem labeling). | 15 min | 2 |
| 3.2 | **Strip provenance/cost display from SmartPracticePage.** Tier badge + USD cost = admin info, not student. Move to admin telemetry only. | 20 min | 3 |
| 7.2 | **Remove `DEFAULT_EXAM_ID = 'gate-ma'` silent fallbacks** in 3 jobs files + commander-routes.ts. Replace with: ENV `DEFAULT_EXAM_ID` → first registered exam → clear error. No silent GATE fallback. | 30 min | 7 |
| 7.3 | **Rename `src/gate-server.ts` → `src/server.ts`** + package.json scripts. ~10 import updates, low risk. | 15 min | 7 |
| 7.4 | **Branding strings cleanup.** DESIGN-SYSTEM.md heading + body refs, App.tsx comment, README. (Defer Render hostname rename — operational risk.) | 20 min | 7 |
| 1.5 | **Rename `GateHome.tsx` → `Home.tsx`** + fix App.tsx comment. Queue the bigger `frontend/src/pages/gate/` → `app/` rename as a separate scoped PR (50+ files, risky import churn). | 15 min | 1 |
| 1.2 | **Auth-system unification (RESCOPED per eng review).** SignInPage + LoginPage are not duplicate views — they're two competing auth systems. SignInPage uses Vidhya JWT (canonical, validates against backend's auth-middleware). LoginPage uses Supabase Auth (frontend-only, backend doesn't validate Supabase tokens). The `useAuth` Supabase hook is wired into 4 critical files: GateLayout, ContentAdminPage, GBrainAdminPage, LoginPage. Migration: delete LoginPage + `frontend/src/hooks/useAuth.ts` + `frontend/src/lib/supabase.ts` (auth client only — keep DB client if used); migrate all 4 callsites to AuthContext + `frontend/src/lib/auth/client`. Verify admin surface still loads after migration. | **2-3 hr** | 1 |
| 1.4 | **OnboardPage fallback fix.** Replace algebra/calculus/geometry fallback with loading skeleton + error CTA. | 20 min | 1 |
| 1.6 | **Anon home discoverability link (RESCOPED per eng review).** GateHome already handles anonymous users gracefully (topic grid + free-study fallback). Original plan assumed dead-end; it isn't. New scope: add subtle 'New here? See how it works →' link from anon GateHome to MarketingLanding. Discoverability win, no behavior change. | 15 min | 1 |
| 4-6.D | **TurnsPage role-scoping audit.** Teachers see only their students' turns; admins see all. | 30 min | 4-6 |

**Phase 1 total: ~7-8 hr CC** (revised after eng review found item 1.2 is a 2-3 hr auth migration, not a 30-min cleanup). Customer-visible impact: HIGH.

### Eng review decisions (recorded for traceability)

- **D1 (auth):** User explicitly chose "decide now" rather than defer. Auth-system unification stays in Phase 1 with revised scope.
- **D2 (auth depth):** User chose "stay the course" — full migration of 4 callsites, ~2-3 hr CC, accept the scope expansion.
- **D3 (anon `/`):** User chose "reframe as discoverability link" rather than original "route to MarketingLanding" (which would have changed working behavior).

### PHASE 2 — Consolidations (~one day, separate PR)

Several routes that should be one. Each consolidation removes a confusion source for users AND a maintenance burden for engineers.

| # | Item | Effort | Bucket |
|---|---|---|---|
| 1.3 | **Declutter GateHome (now Home.tsx)** — subtract decorations until the One Thing card is the visual anchor. Move Confetti to celebration moments only; remove GiveawayBanner from default home; collapse YourTeacherCard. | 45 min | 1 |
| 2.1 | **Consolidate /notebook + /smart-notebook** — pick canonical, redirect/merge the other. Reconcile NotebookEntry data shapes. | 1 hr | 2 |
| 3.1 | **Consolidate the 4 practice surfaces.** PracticePage (legacy), SmartPracticePage, PlannedSessionPage, StudymateSessionPage → one canonical entry with mode params; redirect the others. Document the architecture in EXTENDING.md. | 1.5 hr | 3 |
| 3.4 | **PlannedSessionPage delight pass** — the Study Commander surface. Subtract decorations; ensure 'next action' is unambiguous; add 'completed N actions today, M to go' ribbon; fail gracefully when planner returns empty. | 45 min | 3 |
| 3.5 | **Compounding Visibility Card** — periodic, dismissible UI showing concrete evidence: "47 problems this month, 12 concepts mastered, 3 weak spots fixed" or "what you cracked in October is still with you in November (87% retention)." Click-to-expand for deeper analytics. Subtle, not naggy. Anchors the v2.4 Compounding promise into daily UX. | 1.5 hr | 3 (NEW) |
| 4-6.A | **Consolidate 4 admin landings** into one role-aware AdminDashboardPage with role-aware sections. Redirect AdminPage / OwnerSettingsPage (becomes section) / FounderDashboardPage. | 1.5 hr | 4-6 |
| 4-6.C | **TeachingDashboardPage delight pass** — subtract decorations; prioritize 'students needing attention'; show teacher's own progress (% students mastering concepts they teach). | 1 hr | 4-6 |

**Phase 2 total: ~7-8 hr CC. UX coherence + delight gains.**

### PHASE 3 — Big refactors (eng-review-gated, multi-PR)

These individually warrant their own /plan-eng-review before implementation. Don't bundle.

| # | Item | Effort | Why it deserves its own PR |
|---|---|---|---|
| 7.1 | **Parameterize GATE_TOPICS → dynamic per-exam topic loader.** `getTopicsForExam(examId)` reads from exam adapter. 10+ consumers updated. Without this, the platform IS GATE because the topics taxonomy is hardcoded. | 1.5-2 hr | Touches the type system and 10+ consumers; needs eng review for the contract design |
| 2.4 | **Refactor PracticePage** into smaller pieces (`<VerifyAnimation />`, `<CelebrationLayer />`, `<ErrorDiagnosisPanel />`) + edge-case tests for double-submit, network failure mid-verify, navigate-away. | 1.5-2 hr | Heavy refactor with state-machine implications; should not bundle with Phase 1 quick wins |
| 3.3 | **Split ExamSetupPage (1318 lines) into stepped wizard** — `<ExamPickerStep />`, `<ExamDateStep />`, `<TopicConfidenceStep />`, `<ConfirmStep />`. ~250 lines each. | 2 hr | Largest single refactor; user flow architecture decision |
| 4-6.B | **Consolidate 3 content admin pages** (ContentStudioPage 815 + ContentAdminPage 301 + ContentSettingsPage 484) into ContentStudioPage with sections. | 2 hr | 1600 lines reorganized; affects admin operators; needs careful migration |
| (deferred) | **`frontend/src/pages/gate/` → `app/` directory rename** — 50+ file imports change. | 30 min sed + 30 min verify | High mechanical risk; isolated PR with no other changes |

**Phase 3 total: ~9-11 hr CC across 5 PRs.**

---

## What's NOT in this plan (explicitly deferred)

| Item | Why deferred |
|---|---|
| Render service hostname rename (`gate-math-api.onrender.com` → `vidhya.onrender.com`) | Operational risk — DNS, env vars, external integrations. Add CNAME later, redirect during cutover. |
| Frontend `tsconfig.json` JSX intrinsic fix (5856 baseline errors) | Pre-existing issue, separate from this plan's scope. Should be its own focused PR. |
| `@ts-nocheck` cleanup on the 4 verifier files (blog-pipeline, wolfram, sympy, llm-consensus) | Type-drift cleanup. Belongs in its own PR after the upstream type definitions are stabilized. |
| Light-mode per-page accent saturation calibration | v2.4 shipped CSS-variables migration; per-page light mode QA was deferred at that time. |
| 4-tab vs FAB tutor IA question (raised in /design-consultation) | Separate IA decision, not part of this delight pass. |

---

## What already exists (used in this plan)

- `src/exams/` — full exam abstraction module (adapters, exam-store, exam-comparison, exam-enrichment). Used by Phase 1+3 to back the dynamic exam_id loaders.
- `src/api/{syllabus,commander,curriculum}-routes.ts` — already accept `exam_id` as a parameter. Phase 1's removal of `'gate-ma'` defaults builds on this.
- `src/api/chat-routes.ts:89` — `examName` is already pulled dynamically from the active adapter. Pattern to replicate.
- `frontend/src/pages/gate/{ExamSetup,ExamGroups,ExamProfile}Page.tsx` — multi-exam UI shell already exists. Phase 3's `ExamSetupPage` split builds on this.
- `frontend/tailwind.config.cjs` — v2.4 added emerald + violet tokens. Phase 1's "frugal layout" + "Compounding visibility" use these.
- Design system v2.4 (`DESIGN-SYSTEM.md`) — Compounding promise + Editorial-Confident aesthetic + restrained decoration. The principles backing every item in this plan.

---

## Implementation Checklist (Phase 1 — the half-day PR)

```
[ ] 1.1 MarketingLanding hero/stats rewrite (student-empathy copy)
[ ] 2.2 PracticePage verify spectacle removed (instant or single shimmer)
[ ] 2.3 PracticePage strings de-GATE'd (use exam adapter)
[ ] 3.2 SmartPracticePage tier-badge + USD-cost display removed
[ ] 7.2 DEFAULT_EXAM_ID hardcoded fallbacks replaced (3 jobs files + commander-routes)
[ ] 7.3 src/gate-server.ts → src/server.ts + package.json scripts updated
[ ] 7.4 DESIGN-SYSTEM.md heading, App.tsx comment, README branding strings
[ ] 1.5 GateHome.tsx → Home.tsx (file rename + import updates) + queue gate/ dir TODO
[ ] 1.2 [REVISED] Auth-system unification — delete LoginPage + Supabase auth hook; migrate 4 callsites (GateLayout, ContentAdminPage, GBrainAdminPage, LoginPage) to AuthContext
[ ] 1.4 OnboardPage algebra/calculus/geometry fallback → loading skeleton + error CTA
[ ] 1.6 [REVISED] Add 'New here? See how it works →' link from anon GateHome to MarketingLanding (no routing change)
[ ] 4-6.D TurnsPage role-scoping audit (teacher vs admin)
[ ] CHANGELOG entry for v2.5.0
[ ] Tests pass: npm run test:content (27/27 expected)
[ ] Frontend build: vite build (succeeds)
```

---

## Phase Decisions (TBD in implementation conversation)

- **Phase 1 ships today as v2.5.0** — the half-day PR.
- **Phase 2 = v2.6.0** — separate session, targets UX consolidation.
- **Phase 3 = each item as its own PR** — eng-review-gated. Likely v2.7.0+.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAR | 23 picks + 2 principles, 3-phase triage |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | Phase 1 only; 3 substantive findings, all resolved (auth scope revision, anon funnel reframe) |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | Recommended after Phase 1+2 ship |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**VERDICT:** CEO + ENG (Phase 1) CLEAR. Phase 1 is shippable today as v2.5.0. Phase 3 will need its own `/plan-eng-review` before implementation.
