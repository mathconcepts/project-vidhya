---
# Alternative body for greens-theorem.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: greens-theorem.intuition.shaken
concept_id: greens-theorem
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: greens-theorem.intuition
for_stance: shaken
---

Take $\mathbf F=(-y,x)$ and the unit circle $C:x^2+y^2=1$, traversed counterclockwise. Walking the boundary directly: parametrize $x=\cos t,y=\sin t$, so $\mathbf F\cdot d\mathbf r=(-\sin t)(-\sin t)\,dt+(\cos t)(\cos t)\,dt=dt$, and $\oint_C\mathbf F\cdot d\mathbf r=\int_0^{2\pi}dt=2\pi$.

Now check the interior instead. $P=-y,\,Q=x$, so $\partial Q/\partial x-\partial P/\partial y=1-(-1)=2$ at every point inside the disk. Multiply by the area, $\pi(1)^2=\pi$: $\iint_D 2\,dA=2\pi$.

Same number, two routes: one walked the closed boundary counterclockwise step by step, the other summed a constant over the disk it enclosed. Green's Theorem says these always agree, provided the curve is closed, positively oriented, and the field is differentiable on the whole region it bounds.
