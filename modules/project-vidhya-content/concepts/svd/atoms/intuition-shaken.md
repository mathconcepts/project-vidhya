---
# Alternative body for svd.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: svd.intuition.shaken
concept_id: svd
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: svd.intuition
for_stance: shaken
---

## Follow one input vector through

$A$ acts on a vector in three steps: $V^T$ rotates it, $\Sigma$ stretches along fixed axes — big $\sigma_1$ stretches a lot, small $\sigma_2$ barely at all — then $U$ rotates the result into place.

$$A = U\Sigma V^T$$

Every matrix breaks into rotate, stretch, rotate.

## Reading the singular values

Line up $\sigma_1 \ge \sigma_2 \ge \cdots \ge 0$. A large $\sigma_i$ means that direction carries signal; a tiny one means noise, or a direction barely used.

Count the nonzero $\sigma_i$'s and you have the rank — directions the matrix actually uses, not the number it was built with.
