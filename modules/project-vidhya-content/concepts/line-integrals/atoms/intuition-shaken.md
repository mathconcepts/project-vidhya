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

Reuse the hook's own field, $\mathbf F(x,y)=(-y,x)$: does the work depend on the path, or only the two endpoints?

**Path 1 — straight line**, $(1,0)$ to $(0,1)$: parametrize $\mathbf r(t)=(1-t,\,t)$, $t\in[0,1]$, so $\mathbf r'(t)=(-1,1)$. Then $\mathbf F(\mathbf r(t))=(-t,\,1-t)$, and $\mathbf F\cdot\mathbf r'=(-t)(-1)+(1-t)(1)=t+1-t=1$. Work: $\int_0^1 1\,dt=1$.

**Path 2 — quarter circle**, same two endpoints: parametrize $\mathbf r(t)=(\cos t,\,\sin t)$, $t\in[0,\tfrac\pi2]$ — starting at $(1,0)$, ending at $(0,1)$, like path 1. The dot product is the same $1$ as the hook (true for every $t$, not just a full circle), so the work is $\int_0^{\pi/2}1\,dt=\frac\pi2\approx1.57$.

**Check.** Both paths start at $(1,0)$ and end at $(0,1)$, yet one gives work $1$ and the other $\frac\pi2$. Different numbers for different routes between the same two points — exactly what the hook asked you to predict, confirmed here by arithmetic. That is only possible because this field is not conservative.
