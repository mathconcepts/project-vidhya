---
# Alternative body for multiple-integrals.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: multiple-integrals.intuition.shaken
concept_id: multiple-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
variant_of: multiple-integrals.intuition
for_stance: shaken
---

$\int_0^1\int_0^2 xy\,dy\,dx$.

Inner (over $y$, $x$ frozen): $\int_0^2 xy\,dy=x\left[\tfrac{y^2}2\right]_0^2=2x$.

Outer (over $x$): $\int_0^1 2x\,dx=[x^2]_0^1=1$.

Check by swapping the order: inner over $x$ now, $y$ frozen: $\int_0^1 xy\,dx=y\left[\tfrac{x^2}2\right]_0^1=\tfrac{y}2$. Outer over $y$: $\int_0^2 \tfrac{y}2\,dy=\left[\tfrac{y^2}4\right]_0^2=1$.

Same answer, $1$, both orders — confirms the computation.
