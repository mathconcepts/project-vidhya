---
# Alternative body for diagonalization-intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: diagonalization.intuition.assured
concept_id: diagonalization
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: diagonalization-intuition
for_stance: assured
---

## The substitution that matters

$A = PDP^{-1}$ is a change of basis, not a computational trick. $P$'s columns are eigenvectors; $D$ carries the eigenvalues. In that basis $A$ acts diagonally, so anything built from repeated multiplication — $A^k$, $e^{At}$, $\sqrt{A}$ — collapses to acting on $D$ alone.

## The two free checks, and where they stop being free

$n$ distinct eigenvalues guarantees diagonalizability — cheapest test, check it first. Real symmetric guarantees it too, with the bonus that $P$ can be taken orthogonal.

Neither is necessary. The real condition is geometric multiplicity = algebraic multiplicity for every eigenvalue, and that's where GATE tests you: a repeated eigenvalue with too few independent eigenvectors is defective, and no amount of searching produces a third eigenvector where only two independent directions exist.

What happens to $A^k$ when $A$ is defective — is there still a shortcut?
