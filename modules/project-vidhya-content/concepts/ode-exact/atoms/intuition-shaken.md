---
# Alternative body for ode-exact-intuition, served when the learner stance
# is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: ode-exact.intuition.shaken
concept_id: ode-exact
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: ode-exact-intuition
for_stance: shaken
---

## One equation, worked plainly

Take $M\,dx+N\,dy=0$ with $M=2xy+3x^2$ and $N=x^2+4y^3$.

Compute $\dfrac{\partial M}{\partial y}=2x$ and $\dfrac{\partial N}{\partial x}=2x$. They match — that match is the whole exactness test, $\dfrac{\partial M}{\partial y}=\dfrac{\partial N}{\partial x}$.

Because it matches, a function $F(x,y)$ exists with $F_x=M$ and $F_y=N$, and $F=C$ is the solution.

Find it in two moves. First, integrate $M$ with respect to $x$: $F=x^2y+x^3+g(y)$, where $g(y)$ is whatever the $x$-integration couldn't see. Second, differentiate that $F$ with respect to $y$ and match it to $N$: $x^2+g'(y)=x^2+4y^3$, so $g'(y)=4y^3$ and $g(y)=y^4$.

$$F(x,y)=x^2y+x^3+y^4=C$$

That is the general solution — a family of level curves, one per value of $C$.
