# Content delivery: a first-principles review

**Date:** 2026-09-03
**Trigger:** `/design-review` — "Content delivery must resonate and be tuned
to first principles, why did they get it right/wrong, how to address it,
where to concentrate, which areas and how to explain more in less, how to
make it understandable."
**Method:** source-level review, not a live browser audit — this sandbox has
no working headless Chromium (see CLAUDE.md's standing note on the
`/opt/pw-browsers` revision mismatch; `playwright install` is off-limits per
environment policy). Findings are grounded in the actual pedagogy/generation
code and measured against the real content corpus (101 concepts, 1,723 atom
files), not inferred from screenshots.

## Summary

Vidhya's content-delivery pipeline already encodes a genuinely unusual
amount of learning-science first-principles work — more than most ed-tech
platforms attempt, and documented as such throughout CLAUDE.md's history
(Mayer's segmenting/signaling principles in the resonance-beat design,
Sweller's worked-example effect and split-attention effect in the
progressive-reveal and `formal_definition` motion holdout, White & Gunstone's
Predict-Observe-Explain and Slamecka & Graf's generation effect in the
`ped_predict_before_reveal` pattern, Betrancourt/Tversky's animation
meta-analyses in the motion-priority doc). The engineering is not naive.

What this review found is not "the architecture is wrong" — it's that **the
one mechanism built to keep content terse has a coverage gap wide enough to
swallow the platform's own newest and richest content**, and **the one atom
type with the highest cognitive-load ceiling (read right after a student
gets something wrong) is also the one atom type nobody ever gave a length
budget.** Both are measured, not asserted — see the numbers below, produced
by a new report-only tool (`npm run content:reading-load-report`,
`scripts/check-reading-load.ts`) built for this review.

## Finding 1 — the prose-budget gate is blind to resonance-beat text

`ASSURED_PROSE_BUDGET` (`src/content/prose-budget.ts`) and the
`ci:variant-agreement` CI gate hold `hook`/`intuition`/`worked_example`
atoms to 130/200/220 words in their `assured` stance — the platform's one
real, enforced density discipline. It works by calling `countProseWords()`,
which strips every fenced code block (`` ```...``` ``) before counting,
because a fenced block is normally 15-30 lines of `interactive-spec` JSON
that renders as a widget, never as text.

That assumption stopped being true the day resonance beats shipped
(CLAUDE.md, "Resonance beats", 2026-08-30). A beat-carrying hook's
`narration_steps[].text`/`text_shaken`/`text_assured` — the actual sentences
a student reads while the animation plays — live **inside** that same fence.
`countProseWords` strips them along with the JSON scaffolding around them,
so the gate that is supposed to enforce "hooks stay short" cannot see most
of what a beat-carrying hook actually says.

Measured corpus-wide (`countBeatProseWords`/`countTotalReadingLoad`, new
this review, `src/content/prose-budget.ts`): **102 of 1,723 atom files carry
a beat scene**, and the gate undercounts every one of them. The worst cases:

| Atom | Gate sees | Real reading load | Ratio |
|---|---:|---:|---:|
| `matrix-inverse/hook-assured.md` | 28 | 172 | 6.1x |
| `trace/hook-shaken.md` | 25 | 148 | 5.9x |
| `trace/hook-assured.md` | 31 | 159 | 5.1x |
| `linear-independence/hook-assured.md` | 41 | 207 | 5.0x |
| `diagonalization/hook-shaken.md` | 41 | 205 | 5.0x |

`matrix-operations/hook.md` — the base (non-stance) atom, the version most
students actually see — is reported at 64 words by the gate; its real
reading load across one playthrough is 287. That is more than the 220-word
ceiling `worked_example` (the platform's *widest* budget) is held to, on an
atom the system currently believes is a third of that.

A second, related defect confirmed on the sampled example
(`eigenvalues.hook.md`, not yet measured corpus-wide): the intro paragraph
outside the fence and beat 1 inside it both re-introduce the same setup
("sixteen arrows... watch what changes/refuses to turn" vs. "Sixteen
arrows... Watch what changes"). The two were authored independently and
nothing checks them against each other, so the first thing a student reads
is two restatements of the same sentence before the scene has moved at all
— the opposite of "explain more in less."

**Why this happened, not just that it happened:** the density system
(stance guidance blocks + `ASSURED_PROSE_BUDGET` + the CI gate) was built
for the original static-hook shape, before resonance beats existed. When
beats moved narration text into a JSON fence, nothing revisited the
counter that was built assuming a fence never carries prose. This is the
same "parallel truths that drift" bug class this repo has hit before (see
CLAUDE.md, v4.25.0's model-id drift, and the raw-LaTeX/table rendering bugs
from earlier this same day) — a measurement built for one shape of content
silently stopped covering the platform's own next shape of content.

## Finding 2 — `common_traps` is the longest atom type and the only unbudgeted one

`common_traps` has no entry in `ASSURED_PROSE_BUDGET`, no `stances:`
guidance block in any topic template (`modules/project-vidhya-content/templates/*.yaml`
— contrast its bare one-line `guidance:` string with `hook`/`intuition`/
`worked_example`'s multi-paragraph stance-specific instructions), and no CI
density check anywhere.

Measured across all 101 concepts' base `common_traps.md`: **average 146
words, 18 of 101 already exceed 220** (the widest ceiling any *other* atom
type is held to, at its most generous stance) **despite having no ceiling
of its own**. The largest, `symmetric-matrices/common-traps.md`, is 406
words — nearly double that ceiling.

This is the wrong atom type to leave undisciplined. `pedagogy-engine.ts`'s
`selectAtoms()` (E5, error-streak handling) force-injects the student's
`common_traps` atom to the **front of the queue** after three consecutive
wrong answers — the one moment in the whole system where a struggling
student's cognitive load is already elevated. Attentional Control Theory
(Eysenck et al., 2007) and Sweller's cognitive load theory both point the
same direction here: working-memory capacity is scarcest exactly when
frustration/anxiety is highest, so the content served at that moment should
be the *most* disciplined, not the *least*. Right now it's the opposite —
the one algorithmically-privileged, highest-stakes atom type is also the
one with zero editorial ceiling.

## Where to concentrate

In priority order, by leverage (how many students it touches × how wrong
the current default is):

1. **`common_traps` density.** Give it a `stances:` guidance block matching
   `worked_example`'s discipline (an absolute word ceiling for the base/assured
   register, "shaken capped against its own base" for the shaken register —
   the existing pattern, not a new one) and an `ASSURED_PROSE_BUDGET` entry.
   This is an editorial decision (what's the right ceiling — this review
   measured, it did not decide) more than a code one; the code seam already
   exists and this review did not add a new one.
2. **Beat-text budget coverage.** Fold `countBeatProseWords` into
   `ci:variant-agreement` so a beat-carrying hook is measured on its real
   reading load, not just the paragraph outside the fence. This review
   deliberately did NOT wire it in as blocking — turning this on today
   would fail dozens of atoms that were authored honestly against a counter
   that (incorrectly) told their authors they were within budget. That's not
   a content bug to punish retroactively; it's a measurement bug this review
   just fixed. The sequence should be: measure (done, this review), decide
   real per-atom-type beat budgets (editorial), then gate.
3. **Redundancy between intro prose and beat 1.** Worth a real corpus-wide
   pass (not attempted here — this review confirmed the pattern on one
   example, not all 102 beat-carrying atoms) checking whether a hook's
   pre-fence paragraph and its first beat say the same thing twice.

## What was and wasn't fixed in this pass

**Shipped:** the measurement gap itself. `countBeatProseWords()` and
`countTotalReadingLoad()` (`src/content/prose-budget.ts`) give any future
tool — a CI gate, an authoring linter, a generation-time check — a real
number to work from instead of the current blind spot. `scripts/check-reading-load.ts`
(`npm run content:reading-load-report`) is the report this review's own
numbers came from; it is deliberately report-only (exit 0 always) because
turning either finding into a blocking gate requires an editorial ceiling
decision this review is not positioned to make unilaterally.

**Deliberately not done, named honestly:**
- No content was rewritten. Every number above is a measurement, not a
  claim that any specific atom needs to shrink by some amount — that's an
  editorial call once real per-atom-type beat budgets exist.
- The intro/beat-1 redundancy check ran on one example, not the corpus.
- `common_traps`'s `stances:` guidance block and budget entry were not
  authored here — the review measured the gap; closing it is scoped,
  separate work (see TODOS.md).
- No change to `pedagogy-engine.ts`'s error-streak behavior — it correctly
  prioritizes `common_traps` when a student is struggling; the problem is
  that atom type's own length discipline, not the algorithm that serves it.

## Verification

`npx vitest run src/content/__tests__/prose-budget-reading-load.test.ts src/__tests__/unit/scripts/check-reading-load.test.ts` —
14/14 passing. Full backend suite and `tsc --noEmit` run clean (see PR).
`npm run content:reading-load-report` is the tool this doc's numbers came
from — re-run it any time the corpus changes to get current figures rather
than trusting this snapshot as it ages.
