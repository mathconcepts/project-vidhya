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

Same starting facts as the hook: $f(0)=1$ and $f(1)=3$, nothing else. The straight line through these two points gives $f(0.5)\approx2$ — the same estimate the hook already found by joining the dots.

Now suppose a third reading comes in: $f(2)=9$. A straight line can no longer pass through all three points — a parabola is needed instead, and there is only one degree-2 curve through $(0,1)$, $(1,3)$, $(2,9)$. Reading that parabola at $x=0.5$ gives $f(0.5)\approx1.5$ — a *different* answer from the line's $2$, just from knowing one more point.

If the real rule turns out to be $f(x)=3^x$ (it fits all three readings: $3^0=1$, $3^1=3$, $3^2=9$), the true value is $f(0.5)=\sqrt3\approx1.732$. Neither guess was exact, but the parabola's $1.5$ used more information than the line's $2$ — that's the whole trade interpolation makes: more points, a higher-degree curve, and (often, not guaranteed) a better guess.

The polynomial stands in for $f$, not $f$ itself — it matches $f$ only at the given points; elsewhere it is a guess. Lagrange writes the formula directly, as a sum of pieces. Newton builds the same formula one point at a time instead.
