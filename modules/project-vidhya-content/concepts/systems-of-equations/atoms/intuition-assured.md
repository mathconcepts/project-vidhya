---
# Alternative body for systems-of-equations-intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `systems-of-equations-intuition` (no dot),
# a legacy naming drift check-content-integrity.ts tolerates. variant_of
# points at that exact id; this file's own id follows the normal convention
# instead of propagating the drift.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: systems-of-equations.intuition.assured
concept_id: systems-of-equations
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: systems-of-equations-intuition
for_stance: assured
---

## The theorem, and the count that follows from it

$A\mathbf{x}=\mathbf{b}$ is consistent iff $\text{rank}(A)=\text{rank}([A\mid\mathbf{b}])$ (Rouché–Capelli). Given consistency, compare that common rank to $n$: equal gives a unique solution, less gives an $(n-\text{rank})$-parameter family.

## Solving

Row reduction dominates in practice — $O(n^3)$, and it hands you the rank as a byproduct. Cramer's rule ($x_i=\det(A_i)/\det(A)$) is fast for $n\le3$ but scales as $O(n!)$; recognize it, don't reach for it past $3\times3$.

## Homogeneous systems

$A\mathbf{x}=\mathbf{0}$: the trivial solution always exists; a non-trivial one exists iff $\text{rank}(A)<n$, i.e. $\det(A)=0$ for square $A$. That is exactly the condition behind eigenvector systems $(A-\lambda I)\mathbf{x}=\mathbf{0}$ — a zero eigenvalue is a homogeneous system with a non-trivial kernel.

## Fast path on MCQs

If a question only asks "how many solutions," row-reduce to echelon form and read off both ranks — skip back-substitution entirely. That alone answers it in under a minute.
