---
# Alternative body for maxima-minima.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: maxima-minima.intuition.shaken
concept_id: maxima-minima
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: maxima-minima-intuition
for_stance: shaken
---

Take $f(x)=x^3-3x$. Critical points are where $f'(c)=0$ or $f'(c)$ fails to exist. Here $f'(x)=3x^2-3=3(x-1)(x+1)$, zero at $x=1$ and $x=-1$; $f'$ is a polynomial, so it exists everywhere — no corner or cusp candidates to add.

Classify $x=1$ with the sign of $f'$ on either side. Just left, at $x=0.9$: $f'(0.9)=3(0.81)-3=-0.57$, negative. Just right, at $x=1.1$: $f'(1.1)=3(1.21)-3=0.63$, positive. Negative then positive means the function was falling, then rising: a local minimum at $x=1$.

The second derivative confirms it faster: $f''(x)=6x$, so $f''(1)=6>0$ — concave up, a valley, matching the sign-change test.

At $x=-1$: $f''(-1)=-6<0$ — concave down, a local maximum, with no need to check signs on either side by hand.

On a closed interval, say $[-2,2]$, both critical points sit inside it, so evaluate $f$ at all four candidates: $f(-2)=-8+6=-2$, $f(-1)=-1+3=2$, $f(1)=1-3=-2$, $f(2)=8-6=2$. The largest value, $2$, is the global maximum (achieved twice); the smallest, $-2$, is the global minimum (achieved twice). Endpoints mattered here just as much as the critical points did.

For a two-variable function $f(x,y)$ at a point where both partial derivatives vanish, the discriminant $D=f_{xx}f_{yy}-(f_{xy})^2$ decides the type: $D>0$ with $f_{xx}>0$ gives a local minimum, $D>0$ with $f_{xx}<0$ gives a local maximum, and $D<0$ gives a saddle point — the surface rises in some directions from that point and falls in others, like the middle of a mountain pass.

The two checks that always matter: is the derivative actually zero (or undefined) there, and — on a closed interval — did the endpoints get evaluated too?
