---
# Alternative body for line-integrals.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: line-integrals.intuition.shaken
concept_id: line-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: line-integrals.intuition
for_stance: shaken
---

Take $f(x,y)=x$ along the segment from $(0,0)$ to $(1,0)$, parametrized $x=t,\,y=0,\,t\in[0,1]$, so $ds=dt$. Walking the segment and weighting the height $x$ at each step by the tiny distance moved gives $\int_C f\,ds=\int_0^1t\,dt=\frac12$.

Now take $\mathbf F=(y,x)$ over the same segment: $\mathbf F\cdot d\mathbf r=y\,dx+x\,dy$, and since $y=0,\,dy=0$ along this path, that is $0$ everywhere on it, so $\int_C\mathbf F\cdot d\mathbf r=0$. Along the different path from $(0,0)$ straight up to $(0,1)$, $x=0$ throughout, so $\mathbf F\cdot d\mathbf r=0$ there too — two different paths, the same zero answer, because $\mathbf F=\nabla(xy)$ is conservative. A field without a potential function would not generally repeat the same number on a different route.
