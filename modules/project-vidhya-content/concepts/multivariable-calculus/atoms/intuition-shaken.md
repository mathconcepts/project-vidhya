---
# Alternative body for multivariable-calculus.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: multivariable-calculus.intuition.shaken
concept_id: multivariable-calculus
atom_type: intuition
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
variant_of: multivariable-calculus.intuition
for_stance: shaken
---

$f(x,y)=x^2y$ at the point $(1,1)$.

Freeze $y=1$: slice $g(x)=x^2$. Slope at $x=1$: $g'(1)=2$. So $\partial f/\partial x=2$.

Freeze $x=1$ instead: slice $h(y)=y$. Slope at $y=1$: $h'(1)=1$. So $\partial f/\partial y=1$.

Gradient: $\nabla f=(2,1)$ at $(1,1)$.

Check: recompute symbolically. $\partial f/\partial x=2xy$, at $(1,1)$: $2$. $\partial f/\partial y=x^2$, at $(1,1)$: $1$. Matches.
