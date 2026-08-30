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
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: multiple-integrals.intuition
for_stance: shaken
---

Take $f(x,y)=xy$ over the rectangle $0\le x\le1,\,0\le y\le2$. Split it into tiny rectangles of area $dA=dx\,dy$. Over each one, stand up a pillar of height $f(x,y)=xy$ — near $(1,2)$ the pillars are tall (height near $2$); near the origin they shrink to nothing.

Add every pillar's volume: $\iint_R xy\,dA=\int_0^1\int_0^2 xy\,dy\,dx$. Do the inner sum first, treating $x$ as fixed: $\int_0^2 xy\,dy=x\cdot\frac{y^2}{2}\Big|_0^2=2x$. Then the outer sum: $\int_0^1 2x\,dx=x^2\Big|_0^1=1$. Total volume: $1$.

A triple integral does the same thing one dimension up: instead of area elements $dA$, it sums volume elements $dV=dx\,dy\,dz$, useful for total mass or charge packed into a solid region.

When the integrand or region involves $x^2+y^2$, switching to polar coordinates ($x=r\cos\theta$, $y=r\sin\theta$, $dA=r\,dr\,d\theta$) turns a circular region into a plain rectangle in $(r,\theta)$ — often the difference between a hard integral and an easy one.
