# Add-an-Exam Recipe

**Status:** v1 — the "compatible for expansion" deliverable
**Scope:** the concrete, ordered steps to bring a new exam N onto the platform, and the scorecard for deciding which exam N should be

---

## Why a recipe instead of a checklist per exam

GATE-EM shipped as a from-scratch build. Every exam after it should be materially cheaper — that's the entire claim behind "exam-agnostic." This recipe is the receipt for that claim: ten concrete steps, each with a rough cost, that together define what "add an exam" means in practice. If a future exam needs an eleventh step that isn't a variant of one of these ten, that's a sign the recipe itself needs revising — not a reason to freelance a one-off integration.

## The recipe

1. **Curriculum pack** — syllabus, concepts, prerequisites, learning objectives. ~4-6 expert-days for a math exam.
2. **Exam profile row** — fill in the exam's row per [exam-profile-schema.md](./exam-profile-schema.md). ~1 day including marking verification against the official source (see the schema doc's note on JEE-style rows being hypothesis until verified — this step is where that verification happens).
3. **Capability check** — are all of N's behaviors expressible as a selection from the enumerated capability set in [capability-register.md](./capability-register.md)? If yes, proceed. If not, the missing capability gets scoped as a versioned engine change **first**, before any exam-specific work continues — see the architecture sentence in that document.
4. **Launch bank** — the item bank N needs to go live. Bridge-eligible items come from E5 overlays; the generation ladder fills the remaining gaps. Every item, bridged or generated, goes through the same verification gauntlet as GATE items — no shortcut for "it's just for the new exam."
5. **Golden-set share** — a golden set of verified items matching N's item styles, sized for calibration. ~1-2 expert-days.
6. **Prompt versions** — generation prompts tuned to N's exam style (register, difficulty calibration, question-type conventions).
7. **Brand strings + accent + landing variant** — N's `accent_token` and brand strings from the exam profile row, plus a landing-page variant. ~0.5 day.
8. **Mock-format config** — N's CBT mirror (session length, palette, calculator policy) per its `mock_format` field.
9. **Demo-theater tour variant** — a persona/scenario variant so N is demonstrable the same way GATE is (see [moat-demo.md](./moat-demo.md) for the pattern this extends).
10. **Pilot gate** — N's first users get the same 5-user checkpoint discipline that gated earlier launches before N+1 starts. No exam skips the checkpoint because it's "just the next one."

**Total marginal cost** for a math-heavy exam with good bridge overlap: **~7-10 expert-days + verification compute.** That number is only honest if step 3 comes back clean — an exam that fails the capability check costs whatever the missing capability costs, on top of the 7-10 days, and that capability work is scoped and shipped as its own versioned change before N's steps 4-10 continue.

## Expansion scorecard — which exam is N?

Rank candidate exams by:

- **Bridge-overlap %** with verified content already in the bank (higher overlap → cheaper step 4)
- **Segment-demand evidence** (real signal a cohort of students actually wants this exam, not a guess)
- **Capability delta** (fewer new capabilities needed at step 3 → cheaper and faster; zero delta is the ideal case)

Under this scorecard, **math-heavy exams** — JEE Advanced, state CETs, CAT quant, banking/SSC quant — rank ahead of anything that would require new verification machinery, because the 3-tier verification pipeline (RAG cache → dual-solve → Wolfram Alpha / CAS check) already knows how to check math. An exam whose items can't be machine-verified the same way is a much bigger bet: it isn't just a new curriculum pack, it's new verification infrastructure, which this recipe doesn't price in.

**Non-math exams are explicitly out of scope** for this recipe as written. That's a scoping choice, not an oversight — the verification story (see the README's "receipt story") is the platform's actual differentiator, and it's math-shaped today. Extending it to non-math domains is a separate, larger decision than "which exam is next."

## See also

- [exam-profile-schema.md](./exam-profile-schema.md) — step 2's data contract
- [capability-register.md](./capability-register.md) — step 3's checklist and the architecture sentence that governs it
- [moat-demo.md](./moat-demo.md) — the demo pattern step 9 extends
