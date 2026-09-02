---
# Alternative body for multivariable-calculus.worked_example, served when
# the learner stance is `shaken`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: multivariable-calculus.worked_example.shaken
concept_id: multivariable-calculus
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: multivariable-calculus.worked_example
for_stance: shaken
---

**Problem.** $z=x^2+y^2$, $x=\cos t$, $y=\sin t$. Find $dz/dt$ at $t=\pi/4$.

**Step 1.** $\partial z/\partial x=2x$, $\partial z/\partial y=2y$.

**Step 2.** $dx/dt=-\sin t$, $dy/dt=\cos t$.

**Step 3.** $dz/dt=2x(-\sin t)+2y(\cos t)$.

**Step 4.** At $t=\pi/4$: $\cos(\pi/4)=\sin(\pi/4)\approx0.7071$. First term: $2(0.7071)(-0.7071)\approx-1$. Second term: $2(0.7071)(0.7071)\approx1$. Sum: $-1+1=0$.

**Answer.**
$$
\boxed{0}
$$

**Check.** $z=\cos^2t+\sin^2t=1$, a constant — so $dz/dt=0$ for every $t$, matching.
