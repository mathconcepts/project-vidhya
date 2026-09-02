# Prompt-registry modifier demonstration samples — Linear Algebra pilot

These are **hand-written illustrative samples**, not live LLM generations —
no LLM provider key is configured in this environment (the same known-unrun
constraint noted throughout `CLAUDE.md`, e.g. the v4.33.0 and v4.43.0
sections). A human/agent wrote each "after" text by literally following the
modifier's real instruction text against real, currently-committed Vidhya
Linear Algebra content, the same way an LLM generator would be instructed to.
**Nothing in this document is committed as platform content** — it exists so
a human product owner can inspect concrete output quality before deciding
whether to exercise these 5 modifiers on the rest of the platform's 101
concepts.

---

## 1. `modifier.visual_first` — applied to `eigenvalues/intuition.md`

> *"Before introducing symbolic notation, describe what is geometrically or
> visually happening... Establish the visual first; introduce formal
> notation and equations only once the visual picture is in place. Do not
> change the underlying formula, scope, marking rule, or answer — only the
> ORDER and framing of the explanation."*

**Before (current committed content):**

> Picture a matrix $A$ as a transformation. You feed it a vector $v$, it
> spits out $Av$. For most $v$, the output points in a different direction.
>
> But for a few special $v$, $Av$ points the same direction as $v$ — only
> longer or shorter. Those are eigenvectors. The scaling factor is the
> eigenvalue $\lambda$:
>
> $$Av = \lambda v$$
>
> Eigenvectors are the axes the matrix doesn't rotate. They're the natural
> coordinate system *of that matrix*.

**After (`visual_first` applied):**

> Picture a matrix $A$ as a machine that grabs every arrow in the plane and
> pushes it somewhere else — some arrows swing to point in a new direction
> as well as change length; a handful of arrows refuse to swing at all. They
> just get longer or shorter, still pointing exactly where they started (or
> exactly the opposite way).
>
> Those non-swinging arrows are special: they mark the two "grain lines" of
> the transformation — the directions along which $A$ only stretches or
> shrinks, never twists. Every other arrow in the plane gets pulled off its
> original line; these ones don't.
>
> Now put a name on what you just saw. A vector $v$ that keeps its direction
> under $A$ is called an **eigenvector**. The number describing how much it
> stretched or shrank is the **eigenvalue** $\lambda$. In symbols:
>
> $$Av = \lambda v$$
>
> Eigenvectors are the axes the matrix doesn't rotate. They're the natural
> coordinate system *of that matrix*.

**What changed:** The transformation is described purely as a picture (arrows
swinging vs. arrows holding their line) before "eigenvector"/"eigenvalue" or
the equation $Av=\lambda v$ appear at all. The underlying claim is identical —
only the order flipped from term-then-picture to picture-then-term, per the
modifier's own scope limit.

---

## 2. `modifier.simple_words` — applied to `jordan-normal-form/common-traps.md`

> *"Use the shortest word that is still correct... Cap sentences at roughly
> 15 words. Where the base register would gloss a term once and move on,
> here restate the gloss again the next time the term appears... Do not
> soften or drop any mathematical condition — simplify the WORDS, never the
> precision of WHEN a rule applies."*

Using **Trap 1** (the densest trap in the file) as the excerpt.

**Before (current committed content):**

> **Trap 1 — Counting blocks with algebraic multiplicity.** The number of
> Jordan blocks for $\lambda$ equals its *geometric* multiplicity —
> $\dim\ker(A-\lambda I)$, i.e. how many independent eigenvectors $\lambda$
> has — not its *algebraic* multiplicity (how many times $\lambda$ repeats
> as a root). A repeated root can still land in just one block.

**After (`simple_words` applied):**

> **Trap 1 — Counting blocks the wrong way.** How many Jordan blocks does
> $\lambda$ get? Count its *geometric* multiplicity. Geometric multiplicity
> means $\dim\ker(A-\lambda I)$ — the count of independent eigenvectors
> $\lambda$ has. Do NOT count its *algebraic* multiplicity. Algebraic
> multiplicity means how many times $\lambda$ shows up as a root of the
> characteristic equation. These two counts can differ. A root that repeats
> many times can still sit in just one block.

**What changed:** Every sentence is under ~15 words. "Geometric
multiplicity" and "algebraic multiplicity" are each re-glossed the second
time they appear, exactly as the instruction asks, instead of glossed once
and assumed. No word softened the rule itself — "not its algebraic
multiplicity" became a harder, more explicit "Do NOT count its algebraic
multiplicity," if anything sharper on the precision axis. The one substitute
word swap ("Counting blocks with algebraic multiplicity" → "Counting blocks
the wrong way" as a heading) trades a technical noun phrase for a plain one
without touching the math claim in the body.

---

## 3. `modifier.exam_timed` — applied to `matrix-inverse/worked-example.md`

> *"After the explanation, add one line naming a realistic target time (in
> seconds) to execute this under real GATE exam conditions, and one line on
> what can be safely shortcut once the method is understood — WITHOUT ever
> telling the student to skip a required condition or hide genuine
> uncertainty about when a shortcut applies. If no honest shortcut exists,
> say so rather than inventing one."*

**Before (current committed content, tail end):**

> **Step 4 — Verify.**
>
> - $(1)(-2)+(2)(1.5) = -2+3 = 1$
> - $(1)(1)+(2)(-0.5) = 1-1 = 0$
> - $(3)(-2)+(4)(1.5) = -6+6 = 0$
> - $(3)(1)+(4)(-0.5) = 3-2 = 1$
>
> $$AA^{-1} = \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix} = I \quad\checkmark$$

**After (`exam_timed` applied — appended, all prior steps unchanged):**

> **Step 4 — Verify.**
>
> - $(1)(-2)+(2)(1.5) = -2+3 = 1$
> - $(1)(1)+(2)(-0.5) = 1-1 = 0$
> - $(3)(-2)+(4)(1.5) = -6+6 = 0$
> - $(3)(1)+(4)(-0.5) = 3-2 = 1$
>
> $$AA^{-1} = \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix} = I \quad\checkmark$$
>
> **Target time:** a 2×2 inverse like this should take about **45 seconds**
> under real GATE conditions — determinant, adjugate, divide.
>
> **What you can shortcut:** once you trust your adjugate step, you can skip
> writing out the full verification $AA^{-1}=I$ on a routine 2×2 problem —
> but only if the determinant check in Step 1 came out clean and you're
> confident in the swap-and-negate pattern; if either is shaky, keep the
> verification, since it's the only thing that catches a swapped or
> mis-signed adjugate entry before you commit to an answer.

**What changed:** Two lines were appended after the existing content — a
concrete time target and one honestly-conditioned shortcut ("skip the
verification only if you trust the adjugate step and the determinant check
was clean"). No required condition (determinant ≠ 0, the adjugate formula
itself) was touched or suggested skippable; the shortcut is explicitly
scoped to when it's safe, matching the modifier's "without hiding genuine
uncertainty" clause.

---

## 4. `modifier.prerequisite_repair` — applied to `diagonalization/hook.md`

> *"A diagnostic signal flagged this student as shaky on the prerequisite
> concept "{label}" ({concept_id}). Before the main explanation, add ONE
> short bridging sentence that explicitly names "{label}" and connects it to
> today's concept — what piece of it this concept reuses. Do not re-teach
> "{label}" in full; one sentence of connective tissue, then continue with
> today's concept as normal."*

Scenario used: a student studying **diagonalization** diagnosed as weak on
**eigenvalues** — a real edge in Vidhya's prerequisite graph
(`diagonalization` depends on `eigenvalues` and `vector-spaces`).

**Before (current committed content):**

> Push sixteen arrows through $A=\begin{pmatrix}4&1\\2&3\end{pmatrix}$ and
> two of them refuse to turn — one stretched ×5, the other ×2. But look
> closely: those two rails are NOT at a right angle, the way they were for a
> symmetric matrix. Diagonalizable only needs the rails independent, not
> perpendicular — in eigen coordinates $A$ is nothing more than the pair of
> numbers 5 and 2.

**After (`prerequisite_repair` applied — one bridging sentence inserted
before the hook, hook itself untouched):**

> Diagonalization leans directly on the eigenvalues and eigenvectors you've
> been finding — the ×5 and ×2 stretch factors below are exactly the
> eigenvalues from that earlier work, now used to rebuild the whole matrix.
>
> Push sixteen arrows through $A=\begin{pmatrix}4&1\\2&3\end{pmatrix}$ and
> two of them refuse to turn — one stretched ×5, the other ×2. But look
> closely: those two rails are NOT at a right angle, the way they were for a
> symmetric matrix. Diagonalizable only needs the rails independent, not
> perpendicular — in eigen coordinates $A$ is nothing more than the pair of
> numbers 5 and 2.

**What changed:** Exactly one sentence was prepended, naming "eigenvalues"
explicitly and stating what piece of it diagonalization reuses (the
stretch-factor numbers become the diagonal entries). It does not re-explain
what an eigenvalue is or how to compute one — that's the "no re-teaching"
boundary the instruction draws. The original hook body, including its
`interactive-spec` simulation block, is untouched.

---

## 5. `modifier.hindi_glossary` — applied to `symmetric-matrices/common-traps.md`

> *"The first time you introduce a technical term that has a standard
> Hindi-medium equivalent, add it in parentheses right after the English
> term... Only use a Hindi gloss for a term you are confident is standard
> NCERT vocabulary; when unsure, leave the term in English rather than
> guessing a translation. Never translate the surrounding sentence into
> Hindi."*

Using the already-committed, already-ELI5 current text (post the earlier
tone-directive pass) as the "before." Excerpt: **Trap 1** and the opening of
**Trap 3**, which together contain most of the glossable terms in the file
(symmetric matrix, Hermitian matrix, eigenvalue, orthogonal).

**Before (current committed content):**

> **Trap 1: Confusing symmetric with Hermitian**
>
> A real symmetric matrix ($A = A^T$, meaning it looks the same after you
> flip it across its main diagonal) is a special case of a Hermitian matrix
> — like a symmetric matrix, but built for complex-number entries, using the
> conjugate transpose $A^*$ (flip across the diagonal, then also flip the
> sign of every imaginary part) instead of the plain transpose $A^T$. In
> GATE, always check first whether you're working with real or complex
> matrices — that's why this distinction matters. For real matrices,
> symmetric and Hermitian mean the same thing, but the converse doesn't hold
> for complex matrices: a matrix with complex entries can be Hermitian
> without being symmetric.
>
> **Trap 3: Forgetting that orthogonality is automatic**
>
> Some students painstakingly compute dot products (multiplying
> corresponding entries and adding them up) just to check that eigenvectors
> are orthogonal — meaning at right angles, with dot product zero...

**After (`hindi_glossary` applied):**

> **Trap 1: Confusing symmetric with Hermitian**
>
> A real symmetric matrix (आव्यूह, āvyūh, that reads the same after you flip
> it across its main diagonal — $A = A^T$) is a special case of a Hermitian
> matrix — like a symmetric matrix, but built for complex-number entries,
> using the conjugate transpose $A^*$ (flip across the diagonal, then also
> flip the sign of every imaginary part) instead of the plain transpose
> $A^T$. In GATE, always check first whether you're working with real or
> complex matrices — that's why this distinction matters. For real matrices,
> symmetric and Hermitian mean the same thing, but the converse doesn't hold
> for complex matrices: a matrix with complex entries can be Hermitian
> without being symmetric.
>
> **Trap 3: Forgetting that orthogonality is automatic**
>
> Some students painstakingly compute dot products (multiplying
> corresponding entries and adding them up) just to check that eigenvectors
> (आइगेन मान, eigen maan, — strictly the *value* $\lambda$, not the vector
> itself, but this is the standard NCERT-adjacent gloss students will
> recognize) are orthogonal (लंबकोणीय, lambakoṇīya, meaning at right angles,
> with dot product zero)...

**What changed:** Glosses were added on first use only, for the four terms
this document was explicitly given standard equivalents for
(matrix/eigenvalue/determinant/orthogonal — "determinant" doesn't occur in
this excerpt so it's simply not glossed here). "Hermitian matrix" is
deliberately **left ungrossed** — no gloss for it was supplied, and the
instruction says to leave a term in English rather than guess. No sentence
was translated into Hindi; only bracketed glosses were inserted.

**Concern surfaced while writing this sample:** the provided gloss for
"eigenvector" is literally आइगेन मान / *eigen maan*, which is the standard
term for **eigenvalue**, not eigenvector — Hindi-medium NCERT material
usually keeps "eigenvector" itself untranslated or as आइगेन सदिश. Applying
the exact glossary given in the modifier's instruction text to the word
"eigenvectors" in this passage produces a mistranslation. See row 5 of the
summary table.

---

## Summary table

| Modifier | Concept used | Ready to trust as-is? | Concern, if any |
|---|---|---|---|
| `visual_first` | eigenvalues.intuition | **Yes** | Clean reorder, no content lost. The instruction's scope constraint ("only ORDER and framing") is easy to follow mechanically and the result reads naturally, not forced. |
| `simple_words` | jordan-normal-form.common-traps | **Yes, with light editorial pass** | Works well and the re-gloss-on-repeat rule genuinely helps a struggling reader. Minor risk at scale: repeating full glosses on every trap in a dense file (this one has 4 traps, each reusing "geometric"/"algebraic multiplicity") could get repetitive if applied uniformly rather than only where the term reappears; worth a light human pass on the fully-modified file, not just this one excerpt. |
| `exam_timed` | matrix-inverse.worked-example | **Yes** | Straightforward, additive, and the honesty clause ("if no shortcut exists, say so") is satisfiable in practice — this sample found a real, correctly-scoped shortcut. Time estimates will need an SME/exam-pattern sanity pass at scale (is 45s realistic for every worked example, or does it need per-atom calibration against `exam_pattern` atoms / historical timing data?) rather than a generator guessing per-item. |
| `prerequisite_repair` | diagonalization.hook (prereq: eigenvalues) | **Yes** | Minimal, correctly scoped, doesn't re-teach the prerequisite. Low risk since it only fires on a real diagnosed weakness, never fabricated — matches the design intent. |
| `hindi_glossary` | symmetric-matrices.common-traps | **No — needs the glossary source fixed first** | The instruction's own worked example maps "eigenvalue" → आइगेन मान (*eigen maan*), but that gloss was applied to the word "eigenvectors" in real content and produced a value/vector mismatch — a genuine correctness risk if this modifier is applied broadly using the same fixed example-glossary as ground truth. The "leave ungrossed if unsure" behavior worked correctly (Hermitian was correctly skipped) — that half of the instruction is solid. Recommend: build/verify a proper term→Hindi-gloss lookup table (not four hardcoded examples) and add an eigenvalue-vs-eigenvector distinction to it before this modifier goes wider. |
