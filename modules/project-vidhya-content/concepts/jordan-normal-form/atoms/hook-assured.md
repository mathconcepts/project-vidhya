---
# Alternative body for jordan-normal-form.hook, served when the learner stance
# is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinction that actually costs
# marks (block counting) rather than re-teaching what defectiveness means.
id: jordan-normal-form.hook.assured
concept_id: jordan-normal-form
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: jordan-normal-form.hook
for_stance: assured
---

You already know: repeated eigenvalue, too few eigenvectors, can't diagonalize. The question this concept answers is how close to diagonal you can still get.

Answer: block-diagonal, each block a **Jordan block** — the eigenvalue on the diagonal, $1$'s directly above it. That off-diagonal $1$ is the algebraic signature of a *generalized eigenvector chain*, $Aw=\lambda w+v$, standing in for a missing independent eigenvector.

The exam edge: geometric multiplicity — $\dim\ker(A-\lambda I)$ — gives the *number* of Jordan blocks for that eigenvalue; algebraic multiplicity gives their *combined* size. Assuming one block per repeated root, without checking geometric multiplicity, is the single most common mistake once Jordan form appears at all.
