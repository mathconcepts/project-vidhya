# A delivery-modifier framework for `formal_definition` and `mnemonic` atoms

**Date:** 2026-09-01
**Trigger:** `/investigate` bug report — "Definition/Mnemonic — just a static text. Maybe more soul-searching is necessary where students learn the definition and its meaning at the same time (animation, progression, motion etc). Just a mere text will not give us any MOAT. Propose a very dynamic yet robust content [framework]."
**Status:** PROPOSAL — one small, safe renderer-side increment shipped in this pass (§5); the generation-side recommendation (§4) is a product/cost decision, not made here.
**Builds on:** `docs/designs/2026-08-30-resonance-fused-atoms-plan.md` (beats/trap/motion contract), `docs/designs/2026-08-30-attention-design-content-rendering.md` (the attention-design pass this one continues), `docs/designs/2026-08-31-wow-mechanics-non-matrix-concepts.md` (per-concept scene review, same "propose, don't silently build" discipline followed here).

---

## 0. What was actually true when this pass started

Checked against the live renderer and the committed content, not assumed:

- `formal_definition` and `mnemonic` atoms render through `DefaultAtomCard` → `MarkdownAtomRenderer` exactly like every other prose atom type — plain paragraphs, no stagger, no figure, no interaction. `hook`/`intuition`/`visual_analogy` all carry motion (entry animation at minimum; 26 of them carry a full resonance scene); `formal_definition`/`mnemonic` carry none, on any of the 101 concepts in the graph.
- The renderer does **not** need new code to show a scene on these two atom types. `AtomCardRenderer.tsx`'s figure-promotion check (`presentation.stage !== 'in_disclosure'`) is true for both — `formal_definition` is `'below'`, `mnemonic` is `'above'` — so a `simulation`-kind `interactive-spec` fence on either would already be promoted into the figure slot today. This was verified by reading the gate, not inferred.
- What's missing is **content**: nothing ever authors such a fence on these two types, and — separately — the LLM prompt that instructs the generator to script one (`buildResonanceBlock` in `src/content/concept-orchestrator/orchestrator.ts`) is hard-gated to `atom_type === 'hook' || 'intuition'` only (`isBeatAtom`, orchestrator.ts:598). That gate is a **documented, deliberate** boundary from the resonance plan's own eng review ("Hook/intuition are the fusion surface... every other atom type is unaffected either way"), not an oversight. Flipping it is a real decision (§4), not a bug fix.

So: "just a mere text" is an accurate description, and the renderer is already capable of more — the gap is entirely upstream, in what gets authored and what the generator is told to write.

---

## 1. Why animation is the wrong lever for a *definition* specifically

Before proposing anything, it's worth being explicit about a distinction the bug report's four targets (Recall, Hook, Visual, Definition/Mnemonic) blur together: **not every atom type wants the same fix.** `hook`/`intuition`/`visual_analogy` exist to build intuition — motion, pacing, and a figure are the point. `formal_definition` exists to be the one place on the page a student can look up the *exact*, citable statement — its job is precision and speed of lookup, not narrative.

This isn't a stylistic preference; it's Sweller's split-attention and redundancy effects (cognitive load theory): forcing a reader to track a moving figure *while* parsing a precise statement splits attention between two channels that both need full working memory, and the net effect is worse retention of the definition itself, not better. A definition that autoplays a beat-scripted scene fights its own job.

`mnemonic` is different in kind — a memory device (an acronym, an image, a rhyme) *is* narrative by construction; pacing it the way `visual_analogy` captions are already paced (§5) is a natural fit, not a stretch.

**Conclusion: `formal_definition` and `mnemonic` need different treatment, not the same treatment.** The rest of this doc proposes them separately.

---

## 2. Research grounding

Six established results, chosen because each maps to a concrete, checkable design rule rather than a vibe:

1. **Generative learning — Fiorella & Mayer, *Learning as a Generative Activity* (2015), *Eight Ways to Promote Generative Learning*, *Educational Psychology Review*.** Eight strategies with the strongest evidence: summarizing, mapping, drawing, imagining, self-testing, self-explaining, teaching, and enacting. The common mechanism is that the *learner* does the organizing work, not the material doing it for them. → **Rule: a definition atom should ask the student to do something with the definition (restate it, apply it to a tiny example, spot the false version) before or immediately after presenting it — not just display it.**
2. **Retrieval practice / the testing effect — Roediger & Karpicke (2006) and the large replication literature since.** Being tested on material (even ungraded, even immediately) produces more durable learning than an equivalent amount of re-reading. → **Rule: every definition should be followed by a cheap, immediate self-check, not deferred to a separate `micro_exercise` atom three cards later.**
3. **Dual coding theory — Paivio; operationalized for multimedia by Mayer's *modality* and *spatial contiguity* principles.** Verbal + non-redundant visual coding beats verbal alone, provided the two channels don't duplicate each other's words and stay physically adjacent. → **Rule: a mnemonic's image/device and its verbal form must be co-located and non-redundant (the picture shouldn't just restate the words), matching the repo's own existing `stage: 'above'` placement for `mnemonic`.**
4. **Cognitive load theory / the worked-example and split-attention effects — Sweller (1988, 2011).** Directly grounds §1's claim: don't force integration of two spatially or temporally separated information sources that both need full attention. → **Rule: no autoplaying scene competing with a definition's own text for attention** (this is the rule that rules out simply flipping the resonance-beat gate onto `formal_definition`, §4).
5. **Desirable difficulties — Bjork & Bjork (2011).** A small amount of retrieval friction (spacing, interleaving, generation) that feels harder in the moment produces better long-term retention than smooth, easy presentation — directly against the intuition that "smoother = more MOAT". → **Rule: the self-check in (2) should require the student to generate or select, not just click "reveal".**
6. **Elaborative interrogation / self-explanation — Chi et al.** Prompting "why is this true?" / "why not X instead?" mid-material improves retention over passive reading. → **Rule: a definition benefits more from one well-chosen "why not the almost-right neighboring idea" prompt than from any amount of decoration.**

None of these six argue for animation on a definition. All six argue for **making the student do something** — which is a content/interaction design problem, not a motion-design problem. That reframing is the core of what follows.

---

## 3. The framework: composable delivery modifiers (Wolfram-modifier-inspired)

The bug report explicitly points at Wolfram's prompt-modifier system as inspiration, so it's worth being precise about what that actually is, not just gesturing at the name. The [Wolfram Prompt Repository's modifier prompts](https://resources.wolframcloud.com/PromptRepository/category/modifier-prompts) are small, named, **composable** instructions — `#ELI5`, `#YesNo`, a translation modifier — that a user stacks onto a base prompt in a Chat Notebook to reshape *how* an answer is delivered, independent of *what* it's about. The reusable idea worth borrowing isn't animation at all: it's that **delivery style is a separate, composable axis from content**, expressed as small named units the author (or the generator) can mix and match per atom, rather than one hardcoded shape per atom type.

Applied here, a **delivery modifier** is a small, named, independently-testable unit that:
- targets specific atom type(s),
- adds one generative-learning mechanic (from §2) to the atom's authored or generated body,
- degrades honestly to plain prose when absent (same discipline as every other additive field in this codebase — `narration_steps`, `branches`, `stage_order`: a v1 atom with no modifier renders exactly as today).

Proposed modifier set for `formal_definition` / `mnemonic` (content-schema additions, not renderer rewrites — each maps onto the existing `guided_walkthrough`/interactive-spec machinery already in `frontend/src/components/lesson/interactives/types.ts`, reusing its validated fence/parser rather than inventing a second one):

| Modifier | Mechanic (§2) | Atom types | Shape | Renderer work |
|---|---|---|---|---|
| `#term-first` | generative (self-testing) | `formal_definition` | Show the term/symbol alone first; one tap reveals the statement. Reuses `AnswerReveal`'s existing disclosure exactly — zero new component. | none |
| `#restate-check` | retrieval practice + desirable difficulty | `formal_definition` | A single MCQ immediately under the definition: "which of these restates it correctly?" with 1-2 near-miss distractors drawn from `common-traps.md`'s own entries for the concept (never invented). This is a `guided_walkthrough` with one step — the schema already supports it. | none (schema already supports a 1-step walkthrough) |
| `#not-this` | self-explanation / elaborative interrogation | `formal_definition` | One line naming the closest wrong neighbor concept and why the definition excludes it ("not the same as X because…"), sourced from the concept's prerequisite/related-concept graph, never fabricated. | none — plain authored prose, no schema change |
| `#device-reveal` | dual coding, paced | `mnemonic` | The mnemonic device (acronym/image line) appears first, its expansion paced in via the `.vidhya-atom-body--progressive` stagger already shipped in this pass (§5) — not a scene, just paragraph pacing already built. | none — ships in this PR |
| `#apply-once` | generative (enacting) | `formal_definition`, `mnemonic` | One tiny worked instance of the definition/mnemonic applied to a concrete number, authored inline, not a full `worked_example` atom. | none |

Every row is either **zero renderer work** (reuses `AnswerReveal`, `guided_walkthrough`, or plain prose — all already shipped) or **already shipped in this pass** (`#device-reveal`). This is deliberate: the framework's first slice should prove the mechanic works before asking for a new schema or a new prompt-cost line item. **No row proposes attaching a resonance beat scene to `formal_definition`** — §1's split-attention argument rules that out specifically, not generically.

---

## 4. What this doc explicitly does NOT decide

**Whether to extend `isBeatAtom` (orchestrator.ts:598) to include `mnemonic`.** Mnemonic's `#device-reveal` doesn't need it (§3 — paragraph pacing, not a scene). A full resonance-scene treatment for `mnemonic` specifically (not `formal_definition` — §1's objection doesn't apply to a memory device) is a *plausible* future modifier (call it `#mnemonic-scene`), but it changes per-atom generation cost (`ATOM_TYPE_TO_STAGE_KIND` currently has no cost override for `mnemonic`, unlike `hook`/`intuition`'s explicit `0.005`/`0.010` entries) and needs the same content-quality review the original resonance rollout got before its `isBeatAtom` gate was set. **Recommendation: revisit as a follow-up PROPOSAL once `#device-reveal` has been observed on real traffic, not decided here.**

**Whether to build `#restate-check`'s distractor-sourcing pipeline now.** The mechanic is cheap once the concept's `common-traps.md` entries are wired to a distractor picker, but that picker doesn't exist yet and building it is real work (parsing prose traps into MCQ-shaped near-misses is not mechanical). Flagged as the actual next PR, not silently deferred.

**Whether "the definition-and-mnemonic problem" is really a delivery problem at all**, as opposed to an authoring-depth problem — today's `formal_definition`/`mnemonic` atoms are short by design (the same 400-word prose cap every atom type gets). If the real complaint is "the definition feels thin," more words is a content decision for whoever authors `modules/project-vidhya-content`, not a renderer change, and no amount of pacing or self-check fixes thin content underneath it.

---

## 5. What shipped in this pass

Renderer-only, zero cost, zero content-authoring dependency, immediately live on every `mnemonic` atom in the content base:

- `frontend/src/components/lesson/AtomCardRenderer.tsx` — `mnemonic` atoms now render through the same `.vidhya-atom-body--progressive` paragraph stagger already built for `visual_analogy` captions in this pass (device-line, then its expansion, paced in via CSS, self-disabling under `prefers-reduced-motion`, entry-once per DESIGN-SYSTEM.md's "no celebration animation" rule — this is pacing, not decoration). `formal_definition` deliberately does **not** get this treatment — see §1.
- No schema change, no generation-cost change, no new dependency. Reversible by deleting one conditional.

This is `#device-reveal` from §3's table, shipped ahead of the rest of the framework because it required nothing beyond what this investigation session already built for a different atom type.

---

## 6. NOT-RECOMMENDED

- **Any resonance-style animated scene on `formal_definition`.** Ruled out on cognitive-load grounds (§1), not effort grounds — this would be wrong even if free.
- **Celebration/confetti/pulse on a correct self-check answer.** `DESIGN-SYSTEM.md` bans it outright ("No confetti, no celebration animation, no shimmer, no pulse"); the desirable-difficulty literature (§2.5) also argues the "wow" people are asking for should come from the retrieval act succeeding, not from a visual reward layered on top of it.
- **A second, parallel interactive-spec schema for definitions.** `#restate-check` and `#apply-once` both fit inside the existing `guided_walkthrough` shape; inventing a definition-specific schema would be exactly the "parallel truths that drift" bug class `CLAUDE.md`'s v4.25.0 section already names and fixed once for model-id tables — don't reintroduce the pattern here.

---

## 7. Suggested build order

1. `#device-reveal` for `mnemonic` — **shipped** (§5).
2. `#term-first` for `formal_definition` — content-only (wrap the existing statement in the existing `<details>` convention already used by every `retrieval_prompt`/`micro_exercise` atom); zero renderer work, needs only an authoring-convention doc update.
3. `#not-this` — content-only, one line per atom, cheapest of the remaining rows.
4. `#restate-check` — needs the distractor-sourcing decision from §4; scope as its own follow-up doc once someone owns it.
5. `#apply-once` — content-only, same shape as (2)/(3).
6. Revisit `#mnemonic-scene` (the resonance-gate question from §4) only after (1)-(5) have real usage data to argue from.

Sources: [Modifier Prompts | Wolfram Prompt Repository](https://resources.wolframcloud.com/PromptRepository/category/modifier-prompts) · [Eight Ways to Promote Generative Learning (Fiorella & Mayer, 2015)](https://link.springer.com/article/10.1007/s10648-015-9348-9)
