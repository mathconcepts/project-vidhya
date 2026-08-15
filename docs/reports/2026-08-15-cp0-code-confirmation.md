---
status: ACTIVE
supersedes-claims-in: docs/reports/2026-08-15-demo-full-feel-walkthrough-persona-demo-mode.md
---
# CP0 — Code Confirmation of the Full-Feel Demo Plan

Run 2026-08-15 (day 1, midday gate) against `mathconcepts/project-vidhya` @ `d838958`.
Method: three parallel code-verification passes over the repo. The CEO plan was written
corpus-grounded with no repo clone and named this gate itself (M1 step 0): *"if the seam
differs from the docs, M1 is re-estimated BEFORE it proceeds, not discovered mid-build."*

**Verdict: RE-ESTIMATE. The seam differs materially.** The wiring gap the plan is built
around does not exist. A different, larger gap does.

---

## 1. The founding premise is refuted

> Plan, line 11: *"Currently only static content is displayed — interactives are generated
> but not rendered."*
> Plan, line 15: *"LessonPage renders static content … the generated interactive atoms are
> not wired into that path."*

**Interactives render today, live, on the student-facing lesson page.**

```
LessonPage.tsx:660  →  <AtomCardRenderer atoms={lesson.atoms} …/>
AtomCardRenderer.tsx:560  →  <InteractiveSidecar body={current.content} />
InteractiveSidecar.tsx:48-55  →  dispatch on spec.kind
                                 → Manipulable | Simulation | GuidedWalkthrough
```

`InteractiveSidecar` parses a fenced ` ```interactive-spec ` JSON block out of the atom
body (`interactives/types.ts:106,119-139`) and renders the matching widget. It is covered
end-to-end by `InteractiveSidecar.test.tsx:23-68`. `DefaultAtomCard` strips the fence from
the prose so the JSON never leaks as text (`AtomCardRenderer.tsx:263-267`).

A second renderer path also works: `MarkdownAtomRenderer` resolves
`:::interactive{ref=name}` directives against `modules/project-vidhya-content/interactives-library/`
(`registry.ts:86-109`, `Interactive.tsx`), and is mounted at `AtomCardRenderer.tsx:224`.

**101 content files already carry `interactive-spec` blocks and all of them render.**

### `InteractiveLessonBlock.tsx` does not exist

The plan routes all of M1.1 through *"the existing enrichment → `InteractiveLessonBlock`
path (6 block types shipped)."* That file has never been created. It is described in
`docs/RENDERING-FRAMEWORK.md:44,176` as though it exists; the repo has no such file.

The 6 block types (`callout`, `step-reveal`, `flip-card`, `quick-check`,
`animated-derivation`, `drag-match`) are real but belong to `src/rendering/` — the
**multi-channel** pipeline that renders lessons for Telegram / WhatsApp / voice via
`GET /api/lesson/:id/rendered?channel=…`. `LessonPage` never calls that endpoint. It is
not the web lesson path and wiring it is not what this demo needs.

**Consequence: M1 item 1 as written builds a component the demo does not require, against a
pipeline the demo does not use.**

---

## 2. The real gap: Linear Algebra has no manipulables

This is the finding that matters for the demo, and the plan does not contain it.

| Interactive kind | Repo-wide | Linear Algebra |
|---|---|---|
| `guided_walkthrough` | 99 | **13 (all of them)** |
| `manipulable` | 1 | **0** |
| `simulation` | 1 | **0** |

Both non-walkthrough specs live in `ode-first-order`. Every one of the 12 LA concepts has
exactly one interactive, in `worked-example.md`, and it is a `guided_walkthrough` — a
tap-through-the-steps text reveal.

Set against the plan's own vision (line 38):

> *"a student … **drags an eigenvector until the picture makes sense**"*

and M3 item 8:

> *"one manipulable interactive early"*

There is no content behind either sentence. A `guided_walkthrough` is a fine pedagogical
atom, but it is a text stepper — it is not the tactile "feel" moment the walkthrough was
requested to deliver, and it is not what makes a low-confidence student's picture click.

### And nothing generates them

- `src/content/concept-orchestrator/prompt-patterns.ts` — **zero** mentions of
  `interactive`, `manipulable`, `simulation`, `guided_walkthrough`.
- `modules/project-vidhya-content/templates/*.yaml` — zero matches for `interactive-spec`.
- Every `src/` hit for `interactive-spec` is a **consumer** (`policy-runner.ts:30`,
  `scripts/run-scenario.ts:63`), never a producer.

The 101 existing blocks were hand-authored. They conform perfectly to v1, so **no version
shim is needed** (plan risk H1 is closed — good news), but it also means:

**M1 item 3 — "`content:sample-pack` run scoped to the LA chapter … L3 interactives where
the registry covers" — cannot work.** The script does not exist (§4 below), and even if it
did, no generator emits interactive specs. LA interactives have to be authored.

---

## 3. Confirmed real: the MathBox CDN problem (and it is worse than stated)

The plan is correct here.

```ts
// MathBox.tsx:31-33
const THREE_CDN   = 'https://unpkg.com/three@0.133.1/build/three.min.js';
const MATHBOX_CDN = 'https://unpkg.com/mathbox@2.4.1/build/bundle/mathbox.js';
const MATHBOX_CSS = 'https://unpkg.com/mathbox@2.4.1/build/mathbox.css';
```

Loaded by `<script>` injection (`lib/loadScript.ts:58-91`). `frontend/package.json` has no
`three` and no `mathbox` dependency — they are 100% runtime CDN fetches. At an offline
venue these fail.

Two amplifications the plan does not carry:

1. **No capability probe exists.** Grep for `deviceMemory`, `getContext('webgl'`,
   `WebGLRenderingContext` across `frontend/` → zero hits. The 3D→Lite fallback is
   *reactive*: try the CDN, catch the failure (`MathBox.tsx:93-95`). The plan's proposed
   probe is net-new work, not a tweak.
2. **The fallback costs a 6-second stall.** `loadScript` is called with
   `timeoutMs: 6000` (`MathBox.tsx:60-61`). Offline, every manipulable freezes for six
   seconds before degrading to SVG. In front of a skeptical principal that reads as a
   broken product, not a graceful fallback. Bundling fixes this; the timeout path should
   also be short-circuited when the probe says "no network / no WebGL".

An internal doc comment contradicts the code: `src/content/modality-orchestrator.ts:13,126`
claims *"MathBox WebGL 3-D (bundled lazy ESM, no CDN)"*. It is lazy (code-split), but the
payload is a CDN script tag. Stale comment — fix as part of this work.

---

## 4. Already built — the plan proposes rebuilding these

### 4a. Split-screen personalization reveal (D3.1, sized ~2-3d) — **ships today**

`POST /api/admin/scenarios/:id/neutral-render` + `ScenariosPage.tsx` already render exactly
this. `EventRow` (lines 218-291) is a two-column grid
(`gridTemplateColumns: '1fr 1fr'`, line 272): **"Personalized (this run)"** vs
**"Neutral (generic prompt)"**. The page's own doc comment calls the side-by-side
*"the moat surface."* Backend re-generates with `student_context` omitted
(`admin-scenarios-routes.ts:121-187`), rate-limited 10/hr/admin, disk-cached.

Remaining work is surfacing it inside a demo rail, not building it.

### 4b. Fixture-profile seeder + demo isolation (M2 item 5 / item 7) — ~70% built

`data/personas/*.yaml` + `src/scenarios/` already provide the persona spec the plan
describes: `initial_mastery` (mastery vector), `recent_misconceptions` (error history),
`motivation_state`, `representation_mode`, plus a scripted `answer_policy`. Full validation
in `persona-loader.ts:81-160`.

Isolation is already stronger than the plan asks for. `persona-seeder.ts:29-56` derives a
deterministic UUID from `SHA-256('persona:'+slug)` under the reserved prefix `0aded0a0`,
and lines 78-89 **refuse to overwrite** any row that is not a persona id. There is
deliberately no `is_demo` column (`persona-seeder.ts:13-15`) because it would breach the
surveillance-cliff invariant — worth knowing before adding the plan's `demo` provenance flag,
which would reintroduce exactly that shape.

Two of the four proposed personas already exist: `priya-cbse-12-anxious` (anxious,
geometric) and `arjun-iit-driven` (driven, algebraic). **Missing: teacher, principal.**

### 4c. Two unrelated demo systems already exist

The plan must name which one it extends:

- **(a)** `data/personas/*.yaml` + scenario runner + `/admin/scenarios` — scripted student
  personas, the moat demo.
- **(b)** `demo/seed.ts` — six role-based login users (owner / admin / teacher / 3 students),
  generating a static `frontend/public/demo.html` role picker.

They share no code. "Persona demo mode" currently means two different things in this repo.

---

## 5. Confirmed absent (plan is right that these need building)

| Thing the plan assumes | Status |
|---|---|
| `content:sample-pack` npm script | **Absent** — not in `package.json` |
| `/admin/preview` route | **Absent** — not in `App.tsx` |
| `--compare` preview plumbing (D3.1's stated basis) | **Absent** — `neutral-render` is the real equivalent |
| `/demo` route | **Absent** — there is a static `/demo.html` from `demo/seed.ts:337` |
| Reset for scenario trial runs | **Absent** — `demo:reset` only clears `demo/seed.ts` users, not `.data/scenarios/` |
| WebGL / deviceMemory capability probe | **Absent** |
| Render-boundary error path per interactive block | **Absent** — sidecar returns `null` on bad spec; no counter, no `InteractiveSpecUnrenderableError` |

---

## 6. Unflagged risk: the receipts rail needs receipt objects

`ReceiptBorder` renders the border **only** when passed `{verified: true}`
(`ReceiptBorder.tsx:26-28` — *"No receipt object, no border"*, enforced by construction).
Today only three call sites pass one, all hard-coded literals
(`PracticeAttemptPage.tsx:400`, `SpinePage.tsx:271`, `VerifyPage.tsx:84`).

The plan's fixture-coherence validator (item 5) reconciles aggregates → rows → attempts but
never mentions receipts. If seeded fixture attempts carry no receipt object, the principal's
skeptic rail — whose entire premise is *"every number here is tappable, try to catch it"* —
renders with no receipt borders at all, and the plan's claim that *"the receipt aesthetic is
the demo's spine"* silently fails at the exact moment it is load-bearing.

**Fixture receipts must be part of the coherence contract.**

---

## 7. Re-estimate

| Plan item | Sized | Actual | Why |
|---|---|---|---|
| M1.1 interactive wiring | (in M1 ~2.5-3) | **~0** + small error-boundary task | Already renders; `InteractiveLessonBlock` is the wrong target |
| M1.2 MathBox bundling | (in M1) | **Up**, + capability probe + 6s-stall fix | Probe is net-new; stale comment to fix |
| M1.3 LA fill via sample-pack | (in M1) | **Up, and re-typed** | Script absent; no generator emits specs → hand-authoring |
| M1.4 walkthrough scripts | (in M1) | unchanged | |
| M2.5 seeder + isolation | ~1-1.5 | **Down (~30% left)** | Persona spec, seeder, UUID namespace, overwrite guard all exist |
| M2.6 journey deck / `/demo` | (in M2) | unchanged | Genuinely absent |
| M2.7 reset | (in M2) | partial | Scenario-run reset genuinely absent |
| D3.1 split-screen | ~2-3d | **~0, surfacing only** | `neutral-render` is this feature |
| D3.3 first-win w/ manipulable | ~1-2d | **blocked on M1.3** | No LA manipulable exists to open on |

**Net:** the engineering surface is *smaller* than planned; the content surface is *larger*
and it sits on the critical path, because D3.3 cannot be built until LA manipulables exist.

### The day-1 instruction is a no-op

Plan, day 1 parallel track:

> *"Kick the LA `content:sample-pack` run TODAY (generation is wall-clock and independent
> of rendering — never let it wait for the wiring)"*

The script does not exist, and no generator emits interactive specs. Followed literally,
day 1's parallel track produces nothing, and the content gap surfaces around day 3 with no
runway left. The instinct — *start the wall-clock content work on day 1* — is exactly right;
the mechanism is wrong.

**Correct day-1 parallel track: author LA `manipulable` / `simulation` specs by hand against
the locked v1 schema**, starting with the concepts that demo best (eigenvalues,
linear-transformations, determinants, vector-spaces). Schema is frozen and machine-checked
(`validateManipulable` / `validateSimulation`, `types.ts:155-198`), so this parallelises
cleanly across low-cost models with a validator as the gate.

---

## 8. Correction to §1, and what the premise really was

§1 refuted *"interactives are generated but not rendered"* on the grounds that
`InteractiveSidecar` is live-mounted. That is true of the wiring, and it is the wrong
conclusion to draw about the product.

Running the new linter across the content module found that **50 of the 101
`interactive-spec` blocks were invalid and rendered as nothing**: 49 were missing the
required `title` field, one had malformed JSON. `parseInteractiveSpec` rejected them,
`InteractiveSidecar` returned `null`, and there was no error, no counter, and no test.

So the original observation behind this whole plan — *"currently only static content is
displayed"* — **was correct**. Roughly half of every lesson's interactives were invisible.
The diagnosis was wrong (wiring), not the symptom. Two authoring styles had drifted apart:
pretty-printed specs carrying a `title`, and minified specs without one. Only the first
kind ever rendered.

That reframes the CP0 verdict. The plan was right that something was broken and right that
it needed fixing before a demo. It was wrong about where, and the wrong location was
load-bearing: M1.1 would have built a component (`InteractiveLessonBlock.tsx`) against the
multi-channel pipeline and shipped without the actual defect being touched.

## 9. What was fixed on day 1

| Fix | Scale | Commit |
|---|---|---|
| Invalid `interactive-spec` blocks repaired | 50 files | `5084a64` |
| `lint-interactive-specs` — validates AND executes every spec | new | `5084a64` |
| Dead MathBox CDN tier removed; `capability.ts` probe added | 5 files, 16 tests | `8a950f8` |
| Leaked generator scaffolding removed from shipped atoms | 43 files | `94a0e02` |
| LA manipulables + simulations authored | 6 new specs | `94a0e02` |
| z-transform atom shift repaired, missing intuition atom authored | 4 files | `2d90f24` |
| Unmatched code fences repaired | 41 files | `c86a3f1` |
| `ci:content-integrity` + `ci:interactive-specs` CI gates | new | `c86a3f1` |

Verification: 107/107 interactive-spec blocks valid and exercised · 783/783 atom files
clean · backend 1967/1967 · frontend 259/259 · typecheck clean.

### The offline requirement is now met by subtraction

The plan's M1.2 was *"move three.js + mathbox into the build."* Removing the tier was
strictly better: the interactive path now has **no external network dependency at all**, so
the venue smoke test's zero-dependency assertion holds by construction rather than by
bundling discipline. The 6-second stall is gone with it.

The cost, stated plainly: there is no WebGL tier any more, so *"drag an eigenvector in 3D"*
is not available for this demo. What replaces it is a `manipulable` on the eigenvalues
concept — drag the four entries of a 2×2 matrix and watch trace, determinant, discriminant
and both eigenvalues move — plus a `simulation` on the hook atom that traces the ellipse
whose axes are the eigenvectors. Both are dependency-free and cannot fail at the venue.

## 10. Revised M1 status

| Item | Original | Status |
|---|---|---|
| 0 · code confirmation | ½ day | **done** — this report |
| 1 · interactive wiring | (M1 bulk) | **superseded** — wiring was fine; the 50 dead specs were the real defect, fixed |
| 2 · MathBox bundling | (M1 bulk) | **done by removal** + capability probe |
| 3 · LA fill | (M1 bulk) | **partial** — 6 interactives authored; more LA concepts still carry only guided_walkthroughs |
| 4 · walkthrough scripts v1 | (M1 bulk) | **not started** |

M2 (`/demo` entry, journey deck, persona seeding, reset) and M3 (first-win rail, receipts
rail, split-screen surfacing, captions, live-doubt) are untouched. Per §4 they are smaller
than planned — the persona seeder and the split-screen reveal already exist — but they are
still the bulk of the remaining schedule.

## 11. Still open, carried forward

- ~~**Receipt objects in fixtures (§6).**~~ **RESOLVED, and the diagnosis inverted.**
  The gap was not that fixtures lacked receipts — it was that `SpinePage` already drew
  the border over `sr_sessions` recall counts and called them "verified attempts", so
  any seeded profile with attempts earned a promise nothing backed. Fixed by making
  `lib/receipt.ts` the only place a receipt may be minted (`source` now required, so
  `{verified: true}` no longer type-checks), removing the unbacked border and its copy,
  and adding a CI invariant that fails on a receipt literal anywhere else. The skeptic
  rail can now be built on this surface: fewer borders, every one of them tappable.
- **147 cosmetic atom-id drifts** (`visual_analogy` vs `visual-analogy`). Tolerated by the
  new gate on purpose; worth a single normalising pass someday, not before the demo.
- ~~**A real WebGL tier**~~ — **RESOLVED by owner decision, 2026-08-15.** The
  slider-driven eigenvalue manipulable is the accepted substitute for 3D orbit-drag.
  No WebGL tier for this demo. The capability probe written alongside the MathBox
  removal was deleted rather than kept as dead code; if 3D is ever revived it needs a
  mathbox version that exists, a device-capability gate, and vendored same-origin
  assets. Recorded in `registry.ts` next to the removal note so it is not re-litigated.
- **No generator emits `interactive-spec`.** Every one of the 107 is hand-authored. Until a
  generator learns the schema, "fill a new topic with interactives" stays authoring work —
  which is worth knowing before promising a second demo vertical.

---

## 12. What the browser walk found (M2/M3 verification, 2026-08-15)

Everything in M1–M3 was green — unit tests, three CI gates, typecheck, a
production build — and the demo was still broken end to end. Driving the rail in
a real Chromium found four defects in one pass, none of which any test could
have caught:

| Defect | Effect at the venue |
|---|---|
| `/demo` hit the one-shot welcome redirect | The deck rendered "Welcome to Vidhya". The redirect fires for a *first-time* visitor — precisely who a demo is for |
| Exempting `/demo` alone was not enough | The tap landed on `/lesson/eigenvalues`, and the redirect fired *there*. The journey still ended on the welcome page one tap in. Fixed by exempting an active persona, wherever the rail goes |
| `height="auto"` on an `<svg>` (`DesmosLite.tsx:98`) | Not a valid SVG length; the browser rejects the attribute |
| `index.html` fetches Inter Tight + JetBrains Mono from Google Fonts | **Resolved** — self-hosted, see below |

The first two are the ones that mattered: a validator that proves every card's
atoms exist cannot know that the router will take the visitor somewhere else.

### The offline claim needed narrowing — now it holds (RESOLVED)

Removing the MathBox CDN tier made the *interactive path* free of external
network dependencies, and that claim holds. The **app shell** is not:
`frontend/index.html:18-20` preconnects and loads two font families from
`fonts.googleapis.com`.

At an offline venue on a Linux laptop the `--font-sans` stack degrades past
`-apple-system` / `SF Pro` (Apple-only) and past `Inter Tight` (unreachable) to
`Segoe UI` / `system-ui`. Nothing breaks functionally, but DESIGN-SYSTEM.md
treats typography as load-bearing — "one family, type-led, hierarchy from weight
and whitespace" — and the demo is partly an argument that the product is
carefully made.

**Fixed.** Both families are now self-hosted via `@fontsource` (both OFL-1.1,
which expressly permits it), imported in `src/main.tsx`, latin subsets only at
the same weights the old link requested — 400/500/600/700 sans, 400/500/600
mono. 168KB of woff2 total. A second, duplicate Google Fonts `@import` was also
hiding in `src/styles/tokens/fonts.css`; both are gone.

Verified in the browser rather than asserted: walking the rail now records
**zero requests to any non-localhost host**, zero failed requests, zero console
errors, and `document.fonts` reports Inter Tight 400/500/600/700 loaded. The
venue smoke test the plan specifies — "zero external network dependencies" —
now passes for the SPA.

One external font reference remains outside the app: `frontend/public/admin/
agent/dashboard/index.html`, a standalone static admin page pulling IM Fell
English and IBM Plex. It is not on any demo rail and not part of the SPA
bundle, so it is left alone and recorded here rather than silently swept in.

---

## 13. The principal's rail — two findings from walking it

The receipts rail (M3 item 9) walks `/teaching` → `/teacher/syllabus-coverage` →
`/progress`. Walking it in a browser surfaced two problems on the skeptic's own
path — the worst place to have them, since that rail's entire premise is "try to
catch it".

**`GET /api/teaching/roster` does not exist.** `TeacherSyllabusCoveragePage.tsx:83`
calls it on every load; no such route is registered anywhere in `src/`. The
frontend already `.catch(() => null)`s it, so the page degrades rather than
breaking — but it 404s every time, and the roster count then renders as zero.

Worse, the count's label printed the API path *to the visitor*:
`${rosterIds.length} students from /api/teaching/roster`. A principal auditing
the product would have read "0 students from /api/teaching/roster" on screen.
Fixed to say what is true — a count, or "No roster loaded — paste student ids
below". The missing endpoint itself is left alone: inventing a contract for a
route nobody wrote is a bigger decision than a copy fix, and the page has a
working manual path.

**`GET /api/progress/:sessionId` returns 500 with no database.** The handler
queries `sr_sessions`; without `DATABASE_URL` it throws rather than degrading.
At the venue (local Docker with Postgres) this should work, so it is not
demo-blocking — but a 500 where an honest empty state belongs is the
honest-states law being broken by omission, and `/progress` is the last step of
the principal's drill-down. Not fixed here; recorded so the pre-demo checklist
covers it, and so nobody reads the green rail walk as proof that step 3 has
data behind it.

Neither is caused by the demo work. Both were invisible until the rail was
walked.
