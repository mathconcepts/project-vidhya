---
# Alternative body for partial-fractions.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: partial-fractions.intuition.shaken
concept_id: partial-fractions
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: partial-fractions-intuition
for_stance: shaken
---

Take $\dfrac{1}{x^2-1}=\dfrac{1}{(x-1)(x+1)}$ — the hook's own fraction. Guess the split has this shape: $\dfrac{A}{x-1}+\dfrac{B}{x+1}$.

Multiply both sides by $(x-1)(x+1)$: $1=A(x+1)+B(x-1)$.

Plug in $x=1$ (kills the $B$ term): $1=A(1+1)$, so $1=2A$, giving $A=\dfrac12$.

Plug in $x=-1$ (kills the $A$ term): $1=B(-1-1)$, so $1=-2B$, giving $B=-\dfrac12$.

Check by adding the pieces back: $\dfrac{1/2}{x-1}-\dfrac{1/2}{x+1}=\dfrac{(x+1)/2-(x-1)/2}{(x-1)(x+1)}=\dfrac{1}{x^2-1}$. Matches.

Integrating is now two easy logarithms: $\int\dfrac{dx}{x^2-1}=\dfrac12\ln|x-1|-\dfrac12\ln|x+1|+C$.

A repeated factor like $(x-3)^2$ needs one term for every power up to $2$: $\dfrac{A_1}{x-3}+\dfrac{A_2}{(x-3)^2}$, not just a single term. An irreducible quadratic like $x^2+1$ needs a linear numerator instead of a constant: $\dfrac{Ax+B}{x^2+1}$.

The recipe stays the same every time: write the right template for each factor, clear the denominator, plug in convenient $x$-values, solve.
