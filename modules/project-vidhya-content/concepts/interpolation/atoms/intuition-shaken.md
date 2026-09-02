---
# Alternative body for interpolation.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: interpolation.intuition.shaken
concept_id: interpolation
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: interpolation.intuition
for_stance: shaken
---

## Two points first, then the general rule

You know $f(1)=2$ and $f(2)=4$ — nothing else. The straight line through these two points gives $f(1.5)\approx3$, found by joining the dots and reading off a value.

Add a third point, $f(3)=8$, and a straight line can no longer pass through all three — a parabola is needed instead. That pattern continues: through any $n$ points with distinct $x$-values, there is exactly one polynomial of degree at most $n-1$ passing through every one of them.

The polynomial stands in for $f$, not $f$ itself — it matches $f$ only at the given points; elsewhere it is a guess. Lagrange writes the formula directly, as a sum of pieces. Newton builds the same formula one point at a time instead.
