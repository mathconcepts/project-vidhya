---
# Alternative body for jordan-normal-form.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: jordan-normal-form.intuition.shaken
concept_id: jordan-normal-form
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: jordan-normal-form.intuition
for_stance: shaken
---

$A = \begin{pmatrix} 3 & 1 \\ 0 & 3 \end{pmatrix}$. Only one eigenvalue, $\lambda=3$, and only one independent eigenvector — a second attempt just gives a multiple of the first.

Diagonalization needs two independent eigenvectors here; there's only one, so it fails.

$A$ itself is the fallback: diagonal entries $3, 3$, plus a single $1$ above the diagonal — a superdiagonal entry, the whole difference from a true diagonal matrix.

Stack blocks like this — one per eigenvalue short on eigenvectors — and you get Jordan form. Every square matrix has one.
