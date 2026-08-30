---
# Alternative body for differentiability.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: differentiability.intuition.shaken
concept_id: differentiability
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: differentiability.intuition
for_stance: shaken
---

Look at $y=|x|$ near $x=0$. Just left of $0$, the values at $x=-0.1$ and $x=-0.01$ are $0.1$ and $0.01$, giving slope $\frac{0.1-0.01}{-0.1-(-0.01)}=\frac{0.09}{-0.09}=-1$. Just right of $0$, at $x=0.01$ and $x=0.1$, the values are $0.01$ and $0.1$, giving slope $\frac{0.1-0.01}{0.1-0.01}=1$. Left gives $-1$, right gives $1$ — two different numbers approaching the same point, so there is no single tangent at $x=0$. $y=|x|$ is still continuous there — no jump, no gap — but that is a weaker property than having one well-defined slope.

Compare $y=x^2$ near $x=0$: the slope between $x=-0.1$ and $x=-0.01$ works out to about $0.11$, and between $x=0.01$ and $x=0.1$ it is about $0.11$ too. Zoom in tighter and both sides settle on the same number, $0$ — one tangent, one slope, from either direction.

For a piecewise function, the junction needs two checks, in order: do the two pieces meet at the same value (no jump — that is continuity)? Do the two pieces have the same slope arriving from each side? Both must hold; either one failing rules out differentiability there.

Check the value first, then the slope from each side, then confirm the two slopes agree.
