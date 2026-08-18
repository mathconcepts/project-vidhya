---
# Alternative body for jordan-normal-form.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: jordan-normal-form.hook.assured
concept_id: jordan-normal-form
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: jordan-normal-form.hook
for_stance: assured
---

Jordan form is what's left of diagonalization once you drop the "enough eigenvectors" requirement: block-diagonal, each block $\lambda I$ plus a superdiagonal of $1$s, one block per generalized eigenspace. Every matrix over $\mathbb{C}$ gets one, uniquely up to block order.

Defective is the exam word for a matrix that needs this — geometric multiplicity below algebraic on at least one eigenvalue. When does block size stop being obvious from multiplicities alone?
