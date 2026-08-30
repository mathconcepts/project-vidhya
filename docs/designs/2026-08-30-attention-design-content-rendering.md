# Attention design for content rendering

**Date:** 2026-08-30
**Scope:** the student-facing concept lesson — `LessonPage` → `AtomCardRenderer` → `MarkdownAtomRenderer`, plus the figures `gif-generator.ts` renders into it.
**Brief:** students have short attention; content must be intuitive, attention-capturing and resonant. Review the hook, the visual intuition and the GATE tips-and-tricks surfaces. Use motion and other proven techniques. Put explanation and visual together. Recommend a strategy per atomic unit.

Evidence for every finding below is a rendered page, captured at a 390×844 phone viewport against a local boot of `main`, not a reading of the source.

---

## 1. First impression

> I'm looking at the PDE Basics lesson on a phone. My eye goes to the title, then straight into four stacked grey paragraphs — what GATE asks, how students slip, a past-paper count, and a sentence about why the page opens the way it does. I have not yet seen anything about partial differential equations. I scroll. More grey. Then a white card with a question in it, and directly underneath the question, its own answer, already open. Underneath *that*, two buttons asking whether I got it right.
>
> The first three things my eye goes to are: the title, a wall of grey, and a purple circle floating on top of a sentence I was trying to read.
>
> One word: **preamble.**

The page is built as a document. It should be a sequence of beats. Nothing on the first screen is wrong, exactly — it is all true and all useful — but none of it is the concept, and a student deciding in eight seconds whether this is worth their evening never reaches the concept.

Measured, before any change:

All figures below are CSS pixels measured in the page (`getBoundingClientRect`), not read off a screenshot.

| | Before |
|---|---|
| Orientation block height | **330 px** |
| Distance from page top to the first line of concept content | **557 px** — two thirds of an 844 px screen |
| Lesson page total height | **1,985 px** |
| Answer to the quiz question | **visible, unprompted** |
| "Explanation — N cards above" | **8**, with 3 cards above it |
| Figure on the `visual_analogy` atom | **after** ~90 words of prose |
| Figure palette | **retired v4.4.0 dark theme** on a white card |

---

## 2. Findings

Ordered by cost to the student.

### F1 — Every retrieval atom on the platform showed its own answer · **critical, fixed**

All 100 `micro_exercise` and 100 `retrieval_prompt` atoms author their answer inside `<details><summary>Answer</summary>…</details>`. The author's intent is unambiguous: attempt, then reveal.

`MarkdownAtomRenderer` ran `remark-rehype` with `allowDangerousHtml: false`. That drops raw-HTML nodes — so it dropped the `<details>` and `</details>` markers — but the answer paragraphs *between* them are ordinary markdown and survived. The disclosure vanished; its contents did not.

This is not a cosmetic bug. Retrieval practice is the highest-yield mechanic on the page, and it requires exactly one thing: that the student try before they see. The "Not yet / Got it" buttons underneath were asking a student to self-grade a recall they were never given the chance to attempt.

**Fixed** by `remarkDetailsTransform` in `MarkdownAtomRenderer.tsx`, which folds the open/close markers and the body between them into one node rendered by the new `AnswerReveal.tsx`. Not by enabling `rehype-raw`: atom bodies are not all repo-authored (`applyStudentOverrides` and `applyAbVariants` serve generated variants), so raw-HTML passthrough would open markup injection on a student surface to fix a disclosure widget. The answer is *unmounted*, not hidden — a `display:none` answer is still reachable by find-in-page and by a screen reader.

### F2 — The figure arrived after the prose it explains · **fixed**

`MediaSidecar` was appended below the body for every atom type. On a `visual_analogy` — an atom type whose entire job is to be looked at — the student read ~90 words and *then* met the animation. Apple's product pages, the reference the brief named, never do this: the object leads, the copy captions it.

**Fixed** by the `stage` field of the new `ATOM_PRESENTATION_MAP` (§3), plus `.vidhya-atom-stage` in `globals.css`, which also makes the figure sit *beside* the prose at ≥720px with the figure column sticky. At 390px there is no second column to give, so the phone gets sequence instead of adjacency — which is what makes getting the ordering right matter.

### F3 — All 70 figures were drawn in the retired brand palette · **fixed**

`gif-generator.ts` pinned `bg #0b0d10`, `curve #10b981` (emerald), `accent #a78bfa` (violet) — with a comment reading "matches v4.4.0 design system". `DESIGN-SYSTEM.md` lists the navy `surface-*` ramp and "emerald/violet as brand colours" under **Retired**; `CLAUDE.md` says they "must not reappear". Every `visual_analogy` atom punched a black rectangle in a dead brand's colours into the middle of a white Apple-HIG card. It read as a screenshot pasted in from another product.

**Fixed:** white ground, `#c7c7cc` rules, ink `#1d1d1f` primary trace, `#8e8e93` secondary. Curves are ink and grey rather than green and indigo on purpose — Clarity's two accents are both semantic and both spoken for, and colouring an eigenvector line green would assert the student had mastered something by looking at it. Monochrome also separates the two traces on lightness rather than hue, which survives colour-blindness. All 70 scenes re-render and pass `npm run ci:gif-scenes` including its media-QA contrast checks.

If the design owner wants a real data-visualisation ramp, that is a third colour **role** and belongs in `DESIGN-SYSTEM.md` as a deliberate addition — not smuggled in through a plotting default, which is how the retired palette survived this long.

### F4 — The walkthrough rail described a different lesson than the one above it · **fixed**

The rail read "Explanation — 8 cards above" and "1 interactive figure in this lesson". Three cards sat above it, and none of them carried an interactive.

Two sources of truth for one sentence about one screen: `walkthrough-routes.ts` counts every atom authored on disk via `loadConceptAtoms`, while the carousel renders the adaptive subset `selectAtoms()` chose for this student. Both numbers are correct; only one of them is about what the student can see, and the copy says "above".

**Fixed** by passing the rendered counts into `WalkthroughRail`. The server count still decides *availability*; the client count decides what the copy *claims*.

### F5 — The reading-time chip · **investigated, deliberately unchanged**

Reported initially as a defect: 40 s on a card whose visible content is a one-line question and four options, because it was counting the hidden answer. I changed `readingTime.ts` to strip `<details>` blocks and the repo's own drift guard — `src/content/__tests__/prose-count-agreement.test.ts` — failed on exactly the 200 affected atoms.

That guard was right and the change was wrong, for two reasons:

1. `src/content/prose-budget.ts` is the canonical counter and feeds the CI prose-budget gate and the generator's cadence limit. Stripping the answer there would stop the gate policing answer length on every retrieval atom; stripping it only in the frontend would fork one definition into two meanings, which is precisely what that test exists to prevent.
2. The chip is a **clock**, not a word count of currently-visible text. It answers "how long will this card take me", and the student does read the answer — just after attempting it. Counting it is correct.

Reverted. With the answer now hidden (F1), a short-looking card labelled 40 s is arguably a *useful* signal that there is more here than is on screen.

Recorded rather than quietly dropped because the first read looked obviously right and was not.

### F6 — The tutor FAB sat on top of the words · **mitigated**

A 56 px opaque indigo disc, `position: fixed`, over a content column with no reserved gutter. Live QA caught it covering two of four options on a quick check, and mid-sentence on the hook.

Padding the content column would cost every line 56 px of measure on the one axis a 390 px viewport cannot spare, to dodge a control the student is not using while reading. Instead the FAB slides off the right edge while the student scrolls **down** — reading posture — and returns immediately on scroll-up or at rest (`useScrollDirection.ts`).

**Residual, stated plainly:** at rest the FAB still overlays the bottom-right of the content, as it does in Gmail and YouTube. Scroll-hide is the standard mitigation and it covers the reading case, which is when overlap actually costs comprehension. A full fix means either an edge-docked tab or a layout that reserves the corner, and that is a navigation-level decision rather than a lesson-page one.

### F7 — The atom body had no landing point for the eye · **fixed**

Every atom rendered at one uniform 17 px from first word to last, so a 1,944-character `intuition` atom arrived as an undifferentiated grey slab. Students scan before they commit; a slab offers nothing to scan, so the decision it produces is "skip".

**Fixed** in CSS, not in the renderer: `.vidhya-atom-body > p:first-child` is promoted to 20 px/1.45 — the concept's own opening sentence becomes the billboard. Doing this by extracting a lead sentence in JS would mean guessing whether the opening block is a claim worth promoting or a throat-clear, and it would guess wrong on real content. The selector promotes whatever the author put first, which is what an editor would do. A single-paragraph atom is exempt: it would be entirely its own standfirst, which is shouting, not hierarchy. Display math also got room to read as a figure instead of inheriting paragraph rhythm.

### F8 — The server could not boot · **critical, fixed, unrelated to design**

Found while standing the app up for this review. `src/content/atomic-topic-spec.ts:34` used `__dirname` in a `"type": "module"` package. `src/server.ts` → `admin-content-spec-routes.ts` → this file is an unconditional import chain, so the `ReferenceError` fired at module-evaluation time and took the whole process down before any route existed. Production runs the same command (`Dockerfile:76`, `npx tsx src/server.ts`).

It is on `main`, shipped in PR #134. Resolved from `import.meta.url` instead.

**The interesting part is why the suite could not see it.** A boot smoke test already exists — `src/__tests__/server-boot-smoke.test.ts` — written after a near-identical v4.11.0 incident, and its docblock claims it imports the graph "under the same module loader production uses (Node ESM via tsx)". That claim is false. It runs under *vitest's* transformer, and vitest injects `__dirname`/`__filename` shims that tsx does not. Verified both ways against the file exactly as it stood on `main`:

```
npx tsx src/server.ts                     → ReferenceError, process dies
vitest run server-boot-smoke.test.ts      → 3 tests passed
```

So the guard that existed to catch this class was green the entire time, and its own docblock is what stopped anyone adding a real one. Both are addressed: the docblock now states what the test actually covers, and `src/__tests__/unit/esm-dirname-guard.test.ts` greps runtime source for these identifiers rather than trusting the loader (verified non-vacuous — it fails on the original file, passes on the fix).

**Still worth someone's attention:** the live site is serving from a container built before that commit, and the general fix — spawning `npx tsx src/server.ts` as a real subprocess in CI and waiting on `/health` — is not done. That is a CI decision beyond this brief, flagged rather than taken.

### F9 — `docs/` is not in the runtime image · **reported, not fixed**

Related to F8 and found beside it. `Dockerfile` copies `src`, `data`, `config`, `supabase`, `demo`, `modules` — not `docs`. `atomic-topic-spec.ts` resolves its two CSVs from `docs/content-spec/`, and its loader tolerates missing files by design, so in production `/api/admin/content-spec/atomic-topics` returns an empty catalogue rather than erroring. The feature is dead in the deployed image and says nothing about it. Left alone here because it is an admin surface outside this brief, and because the honest fix is a decision about whether spec data belongs under `docs/` at all.

---

## 3. The strategy, per atomic unit

`ATOM_PRESENTATION_MAP` in `AtomCardRenderer.tsx` replaced three parallel tables keyed by the same eleven `AtomType`s — the drift shape this repo has been bitten by before. One row per type, and **every field in it is read at render time**. The strategy that is *not* yet enforced in code is stated below as guidance, and marked as such, rather than added as fields nothing consumes.

### Shipped — enforced by the map

| Atom type | Label | Entry motion | Figure |
|---|---|---|---|
| `hook` | Hook | bounce-alert | **above** |
| `intuition` | Intuition | fade-in | **above** |
| `visual_analogy` | Visual | scale-in | **above** |
| `worked_example` | Worked Example | step-unfold | **above** |
| `micro_exercise` | Quick Check | reveal-highlight | **above** |
| `interleaved_drill` | Drill | slide-up | **above** |
| `mnemonic` | Mnemonic | scale-in | **above** |
| `formal_definition` | Definition | slide-up | below |
| `common_traps` | Common Traps | shake-then-settle | below |
| `exam_pattern` | Exam Pattern | reveal-highlight | below |
| `retrieval_prompt` | Recall | flip-reveal | below |

The split is pedagogical, not decorative: **above** when the figure *is* the idea and the prose captions it; **below** when the prose is the idea and a figure annotates it afterwards.

`retrieval_prompt` is **below** for a reason worth stating separately. A figure shown above a recall prompt cues the answer the prompt exists to make the student retrieve unaided. Sequencing it after the prose is the *weakest* form of that protection — properly the figure belongs inside the `AnswerReveal` disclosure alongside the answer text. It is not there because media is a server-side sidecar rather than part of the markdown body, so folding it in means moving media resolution into the content pipeline. **Open, not solved.**

### Recommended — guidance, not yet enforced

The three surfaces the brief named, in the register each one needs:

**Hook — the job is to make them look, in under four seconds.**
Budget ≤ 40 words. It should open on a concrete object or a question, never on a definition. The PDE hook currently runs 90 words and opens "A partial differential equation involves derivatives with respect to multiple independent variables" — that is a `formal_definition` wearing a hook's label, and it is the single highest-leverage content edit available on this page. A hook with a figure now leads with the figure, which is most of the fix; the copy is the rest, and it is authoring work, not rendering work.

**Visual intuition — the figure carries the argument; the words caption it.**
Budget ≤ 60 words of prose. The current `visual_analogy` atoms mostly get this right and were being undermined by placement (F2) and palette (F3), both now fixed. The next gain is motion that *carries information*: `SimulationSpec.narration_steps` already exists and keys text beats to playback progress, and only `eigenvalues` uses it. Rolling that across the plot-friendly concepts turns a looping GIF into a narrated demonstration, which is the actual Apple/Tesla technique — state is *shown* changing, not described as changing.

**GATE tips and tricks (`exam_pattern`, `common_traps`) — scan, don't read.**
These are already rendered with `structured` on, which turns `- **label**: detail` bullets into hairline-separated label rows. That is the right form. Budget ≤ 25 words per row, and the row label should name the trap, not introduce it. Figure stays below: these are lists of prose and a figure above one would be decoration.

### Across the 116 atomic topics

The map above is keyed by atom *type*, so it applies uniformly to every concept without per-topic work — that is the point of keying it that way. Per-*topic* strategy already has a home: `docs/content-spec/`'s structure map carries recommended hooks, base sequence and delta slots for all 116 atomic topics, and `src/content/atomic-concept-map.ts` resolves 100 of them to a real `concept_id`.

That data does not yet reach generation: `src/blueprints/template-engine.ts` picks atom kinds from its own `CONCEPT_TEMPLATE_FAMILY` table, on a separately-verified path, and never consults the spec. Wiring the two is the natural next PR and the mapping now exists to make it safe. It was out of scope here — this pass was about how an atom *renders*, not which atoms get *made*.

---

## 4. What motion is, and is not, doing here

`DESIGN-SYSTEM.md` allows one curve, four durations, and no confetti, shimmer or pulse, with `prefers-reduced-motion` collapsing every duration to 1 ms. Nothing added here relaxes that.

- Entry motion per atom type was already present and is unchanged.
- The answer disclosure animates **once** on reveal, using `--dur-base`, which self-disables under reduced motion — no separate media query.
- The FAB's retreat uses the same curve and duration.
- The figure's own motion is the GIF, which is the one place motion carries information rather than atmosphere.

The brief asked for motion as an attention technique. The honest answer is that on this page motion was never the missing ingredient — *hierarchy* was, and the two biggest attention wins here (a hidden answer, a figure that leads) involved no animation at all.

---

## 5. Measured result

Same page, same viewport, after.

| | Before | After |
|---|---|---|
| Orientation block height | 330 px | **175 px** |
| Page top → first line of concept content | 557 px | **402 px** |
| Lesson page total height | 1,985 px | **1,324 px** |
| Quiz answer | visible unprompted | **behind "Show answer"** |
| "N cards above" | 8 (3 shown) | **3** |
| Interactive leg | "1 interactive figure" | **"No interactive figure in this lesson"** |
| `visual_analogy` figure | after ~90 words | **first, and beside the prose ≥720px** |
| Figure palette | retired dark theme | **Clarity, 70/70 pass `ci:gif-scenes`** |

---

## 6. Still open

1. **F6 residual** — FAB overlays content at rest. Navigation-level decision.
2. **`retrieval_prompt` figures** — should live inside the disclosure, not merely after the prose. Needs media resolution moved into the content pipeline.
3. **F9** — `docs/` absent from the runtime image; the content-spec admin API is empty in production.
4. **No real boot check in CI** — the existing smoke test runs under vitest's transformer, not tsx's runtime, so it is green on crashes that kill production. The cheap guard added here covers only the `__dirname` class; a subprocess boot covers the rest.
5. **Hook copy** — the rendering now favours hooks; several hooks are still definitions in disguise. Authoring work.
6. **`narration_steps` coverage** — one concept uses it. This is the highest-value remaining *motion* work.
7. **Spec → generation wiring** — `docs/content-spec/` still does not reach `template-engine.ts`.
