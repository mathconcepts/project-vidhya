# Moat-feel demo — guided 3-minute path

> **What this demo proves:** personalization in Vidhya is real and measurable, not theatre. By the end of the 3 minutes the audience has seen, on screen, the SAME atom rendered for a personalized student vs a neutral one — with the scorers and prior-curriculum context that calibrated the personalized side called out explicitly.
>
> **Audience:** smart skeptics. Investors who've seen 30 ed-tech demos. Operators evaluating an LMS. Engineers asking "but is it real?".
>
> **Time:** 3 minutes if you're following this script. ~10 minutes if you're explaining as you go.

---

## 0 · Before the demo (one-time, ~5 minutes)

### Prerequisites

- Mac (or any *nix box)
- Docker Desktop running
- Node ≥ 20, `npm` available
- `OPENAI_API_KEY` in `.env` if you want neutral renders to actually call the LLM (otherwise the side-by-side panel still renders, with whatever the orchestrator returns from its fallback path)

### One-shot setup

```bash
# Backend + DB + auto-applied migrations
docker compose up --build -d

# Frontend dev server (separate terminal)
cd frontend && npm install && npm run dev

# Sanity check — the API root returns 403 by design
curl -sI http://localhost:8080
```

You now have:
- API on `http://localhost:8080` (Postgres + pgvector inside Docker)
- Frontend on `http://localhost:3000`
- All migrations applied, including `024_pyq_holdout` and the curriculum-units schema
- Two locked personas in `data/personas/`

### Sign in as admin (local dev quick-start)

`/api/auth/config` returns `local_dev: true` when `GOOGLE_OAUTH_CLIENT_ID` is unset. The sign-in page renders a "Local dev quick start" panel — click **Admin (Arjun)**. You're redirected to `/admin/content-rd`. From there, the dashboard QuickLink **Persona scenarios** takes you to `/admin/scenarios`.

---

## 1 · Run the trial (~30 seconds)

In a terminal, with the docker stack still running:

```bash
# Priya: CBSE-12 anxious, geometric — lower mastery, prone to algebraic-trap distractors on first exposure
npm run demo:scenario priya-cbse-12-anxious limits-jee --atoms 5

# Arjun: IIT-aspirant driven, algebraic — high mastery, low first-exposure trap probability
npm run demo:scenario arjun-iit-driven limits-jee --atoms 5
```

Each command:
1. Seeds a namespaced `student_model` row (UUID prefix `0aded0a0-` — visible in psql, can't collide with real users).
2. Loads the first N atoms for the concept via the same `loadConceptAtoms()` the lesson route uses.
3. Drives the persona's scripted policy through them, deterministically (mulberry32 PRNG seeded by `SHA-256(persona.id + ':' + concept_id + ':' + atom_idx)` — re-running produces identical output).
4. Writes `.data/scenarios/<run-id>/{trial.json, digest.md}`.

If any atom is interactive (Manipulable / Simulation / GuidedWalkthrough) the trial pauses with a banner pointing at `npm run demo:scenario:resume <run-id>`. Resume from CLI; readline prompts for the answer. 24h timeout if you walk away.

> **Talking point during the run:** "This output is deterministic. Re-running with the same persona + concept produces a byte-identical trial. That makes it a regression artifact, not a one-off."

---

## 2 · Open `/admin/scenarios` (~30 seconds)

In the browser at `http://localhost:3000/admin/scenarios` you'll see:
- **Sidebar:** the two run-ids you just created, newest first.
- **Detail (after clicking one):** persona × concept header, mastery delta with Δ in colour, status pill, per-atom event rows, and a collapsible markdown digest.

> **Talking point on click:** "Priya started at mastery 0.45 on this concept and ended at 0.41 — she dropped two atoms to the algebraic-trap distractor on first exposure, exactly as her persona profile predicts. That signal is what we use to decide whether to regenerate atoms for her."

---

## 3 · The moat surface — side-by-side (~90 seconds)

This is the part the audience came for.

On any event row click **Show neutral version**. The button fires `POST /api/admin/scenarios/:id/neutral-render` which:
1. Re-generates the SAME atom with `student_context = NEUTRAL_CONTEXT` (no representation mode, no recent misconceptions, no prior curriculum). Pure generic prompt.
2. Returns the body. UI renders the personalized + neutral panes side-by-side.
3. Caches on disk keyed by `(concept_id, atom_id)`. Next click for the same atom is free.
4. Rate-limited to 10/hour per admin (the disk cache means you almost never hit it during a demo).

> **Talking point as the panel renders:** "The left pane is what Priya saw. Geometric framing, scaffolding from the school syllabus she's coming from, addressing the chain-rule misconception she tripped on last week. The right pane is what a generic prompt would have produced for a generic student. Same atom, same concept, same author. The difference is the student context the system threaded into the prompt — and we have a CI test, surveillance invariant 1, that guarantees that context never leaks back to the student as visible bytes. They feel personalised; they don't feel observed."

---

## 4 · The closing line (~30 seconds)

Pull up the Effectiveness Ledger at `/admin/content-rd` to land the moat:

> "Personalisation costs us money — every prompt is longer. We don't ship it on faith. The Sprint C learnings ledger watches every active experiment, computes lift_v1 (mastery delta) and pyq_accuracy_delta_v1 (PYQ delta against a frozen holdout bank), and auto-promotes content with `lift > 0.05 ∧ p < 0.05 ∧ n ≥ 30` to canonical. Loss-side, it auto-demotes. We can show the math. The moat is that this loop is closed."

---

## What's actually happening under the hood (for the engineer in the room)

The demo touches every load-bearing piece of the stack:

| Stage | Files | What it proves |
|---|---|---|
| Seed | `src/scenarios/persona-seeder.ts` | Persona is a real `student_model` row, namespaced so it can't collide with real users. Seeder refuses to clobber non-persona rows. |
| Drive | `src/scenarios/trial-runner.ts` + `policy-runner.ts` | Determinism (seeded PRNG). Pause on interactive atoms → resume token → 24h timeout. |
| Render | `/api/lesson/:concept_id` → `applyMediaUrls` → `rankAtomsForLesson` (`src/personalization/lesson-wire.ts`) | The selector wire is single-call-site. A/B-bucket-aware: anonymous and control sessions get the pedagogy-engine's existing order. |
| Calibrate | `src/personalization/student-context.ts` → `toPromptText()` | The SOLE boundary where gbrain context becomes externally-visible bytes. Any new field needs a CI test. |
| Compare | `src/api/admin-scenarios-routes.ts` → `handleNeutralRender` | On-demand neutral render with rate-limit + disk cache. Rate budget protects against a runaway demo. |
| Measure | `src/jobs/learnings-ledger.ts` (Sprint C) + `src/experiments/lift.ts` | Promote-on-win, demote-on-loss, weekly digest. Dual-metric: mastery + PYQ accuracy delta against the holdout. |
| Discipline | `src/personalization/__tests__/surveillance-invariants.test.ts` | 7 CI tests block surveillance-y schema/code/UI from sneaking in. |

---

## Cloud deploy

`render.yaml` auto-deploys `main` to https://vidhya-demo.onrender.com. The persona scenarios surface lives at `/admin/scenarios` there too — but for the live demo we recommend localhost:
- No round-trip latency.
- The seeded `student_model` rows + on-disk `.data/scenarios/` survive between runs without competing with the production data.
- A flaky internet connection at the wrong moment kills the moment.

Run the on-laptop demo first; let prospects see the cloud version land later when they ask "is this actually deployed?".

---

## Troubleshooting

**"`npm run demo:scenario` fails with `seeding failed: ... ECONNREFUSED`."**
Docker isn't up, or `DATABASE_URL` isn't set. `docker compose up -d` and retry.

**"`/admin/scenarios` is empty even though I just ran a trial."**
The API process needs `VIDHYA_SCENARIO_ROOT` to point at the same directory the CLI wrote to. By default both default to `<cwd>/.data/scenarios`. If you ran the CLI in repo root and the API in Docker, the Docker container sees a different cwd — bind-mount `.data/` or run the CLI inside the container.

**"`Show neutral version` returns `rate_limited`."**
You hit 10 calls in an hour. The disk cache means subsequent clicks for atoms you've already neutral-rendered are free — only NEW atoms count against the budget. For a demo, pre-warm by clicking through once before the meeting.

**"The trial paused on an interactive atom and my resume hangs."**
Run `npm run demo:scenario:resume <run-id>` in a real interactive shell (not a CI runner). It uses `readline` and needs stdin.

---

## Security + surveillance notes

The demo lives next to surveillance territory ("we know everything about Priya"). Three guarantees enforced by CI:

1. **Persona files contain no real PII.** The surveillance invariant test greps `data/personas/*.yaml` for UUIDs, emails, and `session_id` keys. Hard-fails the build.
2. **`/admin/scenarios` is admin-gated.** `requireRole('admin')` on every route. Surveillance invariant 7 fails the build if the gate is removed.
3. **The selector's internals never reach the wire.** `admin-scenarios-routes.ts` is grepped for `layers:`, `score:`, `layer_weights:`, `ScoredAtom` — surveillance invariant 6.

If a future PR needs to relax any of these (e.g. a "Why was this picked?" disclosure for the student), it must update the invariant test in the same PR with `INTENTIONAL: relaxes invariant N because [reason]` in the description. The test fail forces the conversation.
