---
# Alternative body for divergence-curl.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: divergence-curl.intuition.shaken
concept_id: divergence-curl
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: divergence-curl-intuition
for_stance: shaken
---

Take the field $\mathbf F=(x,y,0)$ and mark the point $(1,1,0)$. Draw a tiny box around it: on the right face the flow is roughly $F_x=1$ heading out, on the left face it is roughly $F_x=-1$ heading further out still — more is leaving the box than entering. That net outflow per unit volume is the divergence, and here $\nabla\cdot\mathbf F=\partial_x x+\partial_y y=2>0$: a source.

Now take $\mathbf F=(-y,x,0)$ at the origin and imagine a tiny paddle wheel dropped there. At $(1,0,0)$ the field points toward $(0,1,0)$, and at $(0,1,0)$ it points toward $(-1,0,0)$: the wheel gets pushed round its rim. That spin is the curl, and here $\nabla\times\mathbf F=2\hat k$ — nonzero.

Same construction — three partial derivatives assembled from $\mathbf F$ — gives two different answers: a number for spreading, a vector for spinning. Ask the outflow question first, the spin question second; the formulas are bookkeeping for what the picture already showed.
