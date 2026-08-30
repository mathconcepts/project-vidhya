---
# Alternative body for analytic-functions.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: analytic-functions.intuition.shaken
concept_id: analytic-functions
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: analytic-functions-intuition
for_stance: shaken
---

Take $f(z)=z^2$ at the point $x=1,y=1$. Write $f=u+iv$: $u=x^2-y^2$, $v=2xy$. The four partial derivatives there: $u_x=2x=2$, $v_y=2x=2$ — equal. $u_y=-2y=-2$, $-v_x=-2y=-2$ — equal too. Those two equalities are the Cauchy–Riemann equations, and here both hold.

That alone isn't the full proof. CR holding at one point does not by itself make $f$ analytic there — the four partials also have to be continuous in a neighborhood of that point. For $z^2$ they are (they're just $2x$ and $2y$, polynomials), so both conditions hold and $f$ is analytic. A function analytic at every point of $\mathbb{C}$, like $z^2$, is called entire.

Contrast: $g(z)=|z|^2$ has $u=x^2+y^2$, $v=0$, so $u_x=2x$ but $v_y=0$ — the CR equation fails unless $x=0$, so $g$ is analytic nowhere.

If $f$ is analytic, $u$ and $v$ each satisfy Laplace's equation and are called harmonic conjugates of each other.

The two conditions to check, always together: both CR equalities, and continuity of the four partials — drop either and analyticity isn't established.
