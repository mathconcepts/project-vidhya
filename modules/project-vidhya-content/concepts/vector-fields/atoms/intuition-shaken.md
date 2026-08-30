---
# Alternative body for vector-fields.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: vector-fields.intuition.shaken
concept_id: vector-fields
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: vector-fields-intuition
for_stance: shaken
---

Take $\mathbf F=(2x,2y)$. Check: $\partial Q/\partial x=0$ and $\partial P/\partial y=0$, equal, so $\mathbf F$ is conservative — its domain, all of $\mathbb R^2$, has no holes, so the test applies cleanly.

Find $\phi$: integrating $\partial\phi/\partial x=2x$ gives $\phi=x^2+g(y)$; matching $\partial\phi/\partial y=2y$ forces $g(y)=y^2$. So $\phi=x^2+y^2$.

Now $\int_C\mathbf F\cdot d\mathbf r$ from $(0,0)$ to $(1,1)$, along any path, is just $\phi(1,1)-\phi(0,0)=(1+1)-0=2$. Try the straight line $y=x$: parametrize $x=t,y=t$, $\mathbf F\cdot d\mathbf r=2t\,dt+2t\,dt=4t\,dt$, and $\int_0^14t\,dt=2$, the same number, reached the long way, and it would stay $2$ on a curved path too.
