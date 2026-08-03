# Setup → Blueprint → Launch → Review — Demo-Ready Walkthrough (2026-08-03)

## Scope

Per Giri's confirmed answer: polish the existing Setup Wizard (`/admin/setup`), Admin Journey (`/admin/journey`), Blueprints (`/admin/blueprints`), and Run Launcher (inside `/admin/content-rd`) into a smooth end-to-end flow demoable live to someone unfamiliar with the product — better transitions, clearer next-steps, no dead ends. No new pages; wiring up surfaces that already existed.

## What was broken

Walked the flow as an operator would and found two real dead ends:

1. **Setup Wizard had no way out.** Once the readiness banner turned green, there was nothing on the page pointing anywhere else — no link to the journey, no CTA. A demo would stall right after the first "yes, we're ready" moment.
2. **Blueprints → Launch didn't actually connect.** `BlueprintsPage` lets an operator build a blueprint (concept, stages, atom kinds, rationale) and approve it. `RunLauncher` lets an operator launch a generation run. But the two had zero handoff — after approving a blueprint, the only way to launch anything was to re-type the concept, objectives, and atom kinds by hand into the launcher form, which never referenced the blueprint at all. That breaks the entire narrative point of blueprints ("the spec layer between RunLauncher and the orchestrator").

The second one mattered most: the backend already had the plumbing (`POST /api/admin/runs` accepts `blueprint_id` and translates it via `blueprintToUnitSpec()` — see `src/api/admin-runs-routes.ts` §14.2) but the frontend never called it.

## What changed

- **`SetupWizardPage.tsx`** — added the `JourneyNudge` banner (already used on Blueprints/Rulesets/Content-RD/Decisions) and an explicit "Continue setup →" button on the ready banner, linking to `/admin/journey`.
- **`BlueprintsPage.tsx`** — approved blueprints now show a "Launch this blueprint" button linking to `/admin/content-rd?blueprint=<id>`.
- **`ContentRDPage.tsx`** — reads the `?blueprint=` param, loads that blueprint, and passes it to `RunLauncher`.
- **`RunLauncher.tsx`** — new optional `initialBlueprint` prop: pre-fills curriculum-unit mode with the blueprint's concept/exam, threads `blueprint_id` through to `createRun()`, and shows a visible "launching from blueprint X — stages come from the blueprint, not this form" indicator so it's clear what's driving generation. Post-launch success message now points to where to look next ("Watch progress in Active runs below, then check the Effectiveness ledger...") instead of just echoing a run id.
- **`content-rd.ts` API client** — `createRun()`'s type gained the `blueprint_id` field the backend already accepted.

## Result — the flow now

1. `/admin/setup` — confirm readiness → **Continue setup** → journey
2. `/admin/journey` — see the 8-milestone path, jump to whichever's next
3. `/admin/blueprints` — build from template, review stages, approve → **Launch this blueprint**
4. `/admin/content-rd` — launcher pre-filled from the blueprint, cost estimate, launch → active runs → effectiveness ledger, all on one page

Verified: `npx tsc --noEmit` clean, frontend suite 230/230 passing. Committed `69e3008`, pushed to `main`.

## Not touched (out of the confirmed scope)

- Persona scenario validation (`/admin/scenarios`) and student/signal milestones (6-8) — these come after the four surfaces named in the ask.
- The 8-milestone journey's own definitions (`src/api/admin-journey-routes.ts`) are documented as locked; setup-wizard readiness isn't one of the 8 counted milestones. Adding it would be a milestone-schema change, not a polish pass — flagged here in case it's wanted later.
