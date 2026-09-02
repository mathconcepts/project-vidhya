---
# Alternative body for change-of-basis.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: change-of-basis.intuition.assured
concept_id: change-of-basis
atom_type: intuition
bloom_level: 2
difficulty: 0.1
modality: visual
exam_ids: ["*"]
variant_of: change-of-basis.intuition
for_stance: assured
---

$[x]_{B'}=P^{-1}[x]_B$ where $P=[\,[v_1]_{B'}\mid\cdots\mid[v_n]_{B'}\,]$ — columns are $B$'s vectors, expressed in $B'$. The one thing worth internalizing beyond the formula: this is a *passive* transformation. Nothing in the space moves; only the labeling scheme changes.

**Where it earns marks.** For an operator $T$, $[T]_{B'}=P^{-1}[T]_BP$ — a similarity transform. If $B$ happens to be an eigenbasis of $T$, $[T]_B$ is diagonal, and every subsequent computation ($T^k$, solving linear ODE systems) collapses to per-entry arithmetic on the diagonal. Choosing $B$ well is not cosmetic — it's the entire content of diagonalization, restated.

**A trap worth naming:** confusing which direction $P$ goes. If $P$'s columns are $B$'s vectors in standard coordinates, $P$ converts *from* $B$-coordinates *to* standard, and $P^{-1}$ goes the other way — writing it backwards is the single most common error on this topic.
