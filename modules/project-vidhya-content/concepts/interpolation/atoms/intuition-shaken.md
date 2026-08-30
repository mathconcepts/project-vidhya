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
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: interpolation.intuition
for_stance: shaken
---

## Two points first, then the general rule

You know $f(1)=2$ and $f(2)=4$ — nothing else. The straight line through these two points gives $f(1.5)\approx3$, found by joining the dots and reading off a value.

Add a third point, $f(3)=8$, and a straight line can no longer pass through all three — you need a curve with one more bend, a parabola. That pattern continues: through any $n$ points with distinct $x$-values, there is exactly one polynomial of degree at most $n-1$ that passes through every one of them. Interpolation constructs that polynomial and evaluates it wherever you need a value.

The polynomial is a stand-in for $f$, not $f$ itself — it agrees with $f$ only at the points you were given, and everywhere else it is a guess built to fit the pattern. That is the trade: give up the guarantee of exactness away from the known points, and in exchange get a formula cheap enough to evaluate wherever you like.

Lagrange's method writes that formula directly, as a sum of pieces — one per data point — each built to vanish at every other point and equal $1$ at its own. Newton's divided-difference form builds the same formula up one point at a time instead, which makes adding a new data point cheap without starting over.
