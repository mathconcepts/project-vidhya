---
# Alternative body for interpolation.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: interpolation.intuition.assured
concept_id: interpolation
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: interpolation.intuition
for_stance: assured
---

## Where the guarantee quietly stops

Uniqueness needs only distinct nodes: exactly one degree-$(n-1)$ polynomial threads $n$ points with distinct $x$-values.

Accuracy between the nodes is a separate, conditional matter. Push a high-degree polynomial through equally spaced nodes and Runge's phenomenon shows up — oscillations near the edges of the interval that grow, not shrink, as more equally spaced points are added, even though every sample is still matched exactly. Chebyshev-spaced nodes avoid this; equal spacing does not, at any degree.

The costlier mistake is evaluating outside $[x_1,x_n]$: nothing in the construction constrains the polynomial there, and the fitted curve can diverge from the true function arbitrarily fast, with none of the guarantee an interpolated value carries.
