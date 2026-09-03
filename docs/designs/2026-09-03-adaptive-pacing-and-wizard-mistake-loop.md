# Adaptive hook pacing + wizard-to-practice mistake loop

`/investigate` on three points:

1. "hook transition is faster — needs to adapt to different students'
   grasping and attention level. rethink how this can be handled."
2. "walkthrough decision tree looks like a good idea but it must help
   them to connect to the concept in the problem and correct their
   misunderstandings."
3. "reimagine the walkthrough decision tree or its related functionality
   as identifying your mistakes and correcting them, adding more
   practice problems if needed."

## Point 1 — resonance-beat pacing was one-size-fits-all

**Root cause.** `Simulation.tsx:283` computed
`duration = (spec.duration_sec ?? 4) * 1000` — a single author-time
constant, applied at the exact same wall-clock speed to every student who
ever watches that scene. This is true even though `servedStance`
(`'shaken' | 'assured' | undefined`) was already threaded into this exact
component and already used to pick per-beat TEXT
(`resolveBeatText`). Pacing never got the same treatment as register did.

`servedStance` is not a guess: it is derived server-side
(`src/sessions/learner-framing.ts:deriveFraming`) from `motivation_state`,
`consecutive_failures`, and mastery band — precisely the signal for "how
is this student currently grasping and how much attention/patience do
they have left." The text-register system already encodes a real,
documented philosophy for it
(`framingInstructions()`): a shaken student gets a smaller, slower first
step; an assured student gets the sharper, faster form because padding
wastes their time. That philosophy simply never reached the animation
clock.

**Fix.** `paceMultiplierForStance()` (new, pure, exported for tests) maps
`servedStance` to a playback-speed multiplier — `1.35×` (slower) for
shaken, `0.75×` (faster) for assured, `1×` (authored pace, unchanged) for
steady/undefined — applied to `duration_sec` for beat-carrying scenes
only (a non-beat scene has no register difference to begin with, so its
pace is untouched). This reuses the same signal, the same philosophy, and
the same per-scene author-set baseline duration — no new tracking, no new
personalization axis, nothing surveillance-shaped: `servedStance` was
already server-computed and already reaching this component.

The existing manual controls (scrub slider, beat bar, pause) are
untouched and remain the student's own override on top of this
stance-adjusted default — this closes the DEFAULT-pace gap, not a
capability gap; a student could already self-pace manually, but the
default is what everyone meets on first watch, and a shaken/anxious
student under time pressure is the least likely to know to reach for a
manual control.

**Verification:** 3 new unit tests on the pure function
(`Simulation.test.tsx`) plus the full existing 66-test file passing
unchanged (RAF is frozen in this suite, so end-to-end timing isn't
exercised there — the pure-function contract is the right level for this
change, same as `morphFraction`/`shouldHoldForTrap` elsewhere in the same
file).

## Points 2 & 3 — the wizard was a disconnected dead end

**Root cause, investigated together** because both point at the same two
pages: `TheoremWizardPage`/`DistributionSelectorPage`
(`/theorem-wizard/:module`, `/distribution-selector`). Both are thin
shells over `GuidedWalkthrough`'s branching `DecisionTreeWalkthrough`
mode. Two concrete gaps, confirmed by reading the code (not assumed):

1. **No connection to the actual problem.** `PracticeAttemptPage.tsx`'s
   "Which method applies?" button (added in v4.53.1, this same
   investigation thread) navigated to a bare `wizardRoute` with zero
   context — no concept, no diagnosis, nothing. The wizard always opens
   at `branches.nodes[0]`, a generic classification question ("What are
   you being asked about the matrix A?"), with no acknowledgment that the
   student just got a SPECIFIC question wrong. Point 2's complaint is
   exact: the tree "looks like a good idea" (it genuinely IS a real
   method-selection solver — `la_power`/`la_definite` already cover
   eigenvalue-power and definiteness territory) but nothing "connects it
   to the concept in the problem."
2. **No path back into practice.** Reaching a leaf — right or wrong — was
   a dead end. Point 3 asks for exactly the missing half of a real tutor
   loop: identify the mistake (the tree already does this, leaf by leaf),
   then give the student somewhere to go and try it again.

**A real constraint surfaced mid-implementation, and the fix respects
it.** The first design draft added an `onLeaf` callback prop to
`DecisionTreeWalkthrough` so a wrapping page could react to "the student
reached a result" and reveal a practice CTA only then. Running the
existing test suite caught this immediately —
`DecisionTreeWalkthrough.test.tsx` has an explicit, already-written
structural guard:

> "A future onLeaf/onGraded prop would be the hole E5 closes, so the
> source must stay free of one."

E5 (plan amendment) locks this widget as SELF-CHECK ONLY, specifically
because the spec — including which leaf is `best` — ships to the browser
inside a fenced JSON block and is therefore client-visible; the mock-exam
fix earlier in this repo's history closed exactly this class of hole
(client-trusted grading). Even a non-grading `onLeaf` callback is a
foothold a future caller could misuse to report `leaf.best` as if it were
a correctness signal. The test author anticipated this specific prop name
and pre-blocked it. Renaming the prop to dodge the regex would have
honored the letter of the guard while defeating its actual intent, so the
callback approach was dropped entirely rather than worked around.

**Fix that respects the boundary.** `WizardMistakeLoop.tsx` (new,
`frontend/src/components/app/`) exports two presentational components,
both driven ONLY by data already available to the wizard PAGE (never by
anything read out of the widget):

- `WizardContextBanner` — renders "You got a `<concept>` question
  wrong — `<mistake label>`. Work through the questions below to find
  where the mix-up happened." when a `concept` query param is present;
  renders nothing otherwise (a directly-visited wizard is unchanged).
- `WizardPracticeCTA` — a green "Practice more like this" link to
  `/smart-practice?concept=<concept>` (the same real param
  `SmartPracticePage` already reads, and the same route
  `PracticeAttemptPage`'s existing "Practice more like this" button
  already uses). Deliberately NOT gated on reaching a leaf — since the
  page cannot know that without the forbidden callback, the honest
  design is an always-available "when you're ready" escape hatch instead
  of a gated "you're done" reward.

`PracticeAttemptPage.tsx`'s wizard button now builds
`${wizardRoute}?concept=<item.node_id>&mistake=<COMMON_MISTAKE_LABEL[...]>`
— reusing the SAME plain-language label map the wrong-answer screen
already renders inline, so the banner's wording never drifts from what
the student already saw. `TheoremWizardPage`/`DistributionSelectorPage`
read `concept`/`mistake` via `useSearchParams` and render the banner
above, the CTA below, the widget itself untouched in the middle.

**Point 3's "adding more practice problems if needed" is satisfied by
routing, not by new generation.** `/smart-practice?concept=X` already
generates/serves more problems on that concept via the existing
`ProtoCATSelector`/content pipeline — the loop needed a DOOR into that
machinery from the mistake-diagnosis moment, not a new problem-generation
path. Building a narrower "problems specifically targeting the exact
misconception, not just the concept" would be real, separate work (it
would need to thread the diagnosed `failure_tag`/`distractor_failure_tags`
into item selection) — named below as deferred, not attempted here since
`ProtoCATSelector`'s selection signal doesn't currently accept a
misconception filter and inventing one deserves its own scoped pass.

## What this pass does NOT claim

- Pacing: only the DEFAULT autoplay speed adapts. It does not add a
  persistent per-student pace preference, and it does not touch the trap
  hold duration (`DUR_SLOW_S`) — that pause is deliberate signaling, not
  base pace.
- The wizard's tree itself is unchanged — no new nodes, no
  concept-specific deep-linking into a particular branch. Deep-linking
  into the exact matching node would need a concept-id → node-id mapping
  this repo doesn't have and isn't safe to guess; the banner names the
  concept in plain language instead, and the student still walks the
  (short, 2-3 question) tree normally.
- The practice CTA routes to the CONCEPT's practice pool, not to problems
  hand-picked for the specific diagnosed misconception. That's a real,
  separate follow-up (see TODOS.md).
- `THEOREM_WIZARD_TRAINERS` still covers only linear-algebra and
  vector-calculus (plus the standalone distribution trainer) — unrelated
  to this pass, already tracked in TODOS.md from the prior investigation.

## Verification

Frontend `npx vitest run`: 2584/2584 passed (+9: 3 pace-multiplier tests,
1 concept/mistake-propagation test on `PracticeAttemptPage`, 5 wizard-page
context/CTA tests). `tsc --noEmit` clean. `DecisionTreeWalkthrough.tsx`
and `GuidedWalkthrough.tsx` are UNCHANGED in this diff — confirmed via
`git status` — the E5 self-check boundary was never touched.
