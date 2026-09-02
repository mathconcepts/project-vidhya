---
# Alternative body for numerical-integration.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: numerical-integration.intuition.shaken
concept_id: numerical-integration
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: numerical-integration.intuition
for_stance: shaken
---

## One strip, one number, before the general rule

$\int_0^1\frac{dx}{1+x}$ has a closed form, $\ln2\approx0.6931$, but set that aside. Approximate the area with a single trapezoid, using only $f(0)=1$ and $f(1)=0.5$:

$$T=\frac{1}{2}\bigl(f(0)+f(1)\bigr)=\frac{1}{2}(1+0.5)=0.75$$

Already a number: $0.75$ against the true $0.6931$, off by about $8\%$ from one strip.

Split $[0,1]$ into more strips and each contributes its own small trapezoid; add them up and the estimate tightens. Simpson's rule sharpens the same idea further by fitting a parabola instead of a straight line to each small group of points, buying far more accuracy for barely more effort.
