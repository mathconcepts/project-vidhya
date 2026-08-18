---
# Alternative body for jordan-normal-form.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: jordan-normal-form.intuition.assured
concept_id: jordan-normal-form
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: jordan-normal-form.intuition
for_stance: assured
---

A Jordan block of size $k$ for $\lambda$ is $\lambda I + N$, where $N$ is nilpotent with a single superdiagonal of $1$s ($N^k = 0$). One eigenvector spans the eigenspace; the rest of the block is generalized eigenvectors, each satisfying $(A-\lambda I)^j v \ne 0$ for $j$ up to the block size, $=0$ beyond it.

Block count for $\lambda$ equals the geometric multiplicity; block sizes are read off the rank drop of $(A-\lambda I)^j$ as $j$ increases — the standard trap is assuming one block per eigenvalue whenever the algebraic multiplicity exceeds $1$, when in fact several smaller blocks are equally possible and only the rank sequence disambiguates.

Worth remembering as invariant: trace and determinant survive from $A$ to $J$ unchanged, since similarity preserves both — a fast sanity check before committing to a block structure.
