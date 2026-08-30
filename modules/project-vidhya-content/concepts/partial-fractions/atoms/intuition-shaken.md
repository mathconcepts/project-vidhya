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

Take $\dfrac{3x+5}{(x-1)(x+2)}$. Guess the split has this shape: $\dfrac{A}{x-1}+\dfrac{B}{x+2}$.

Multiply both sides by $(x-1)(x+2)$: $3x+5=A(x+2)+B(x-1)$.

Plug in $x=1$ (kills the $B$ term): $3(1)+5=A(1+2)$, so $8=3A$, giving $A=\dfrac83$.

Plug in $x=-2$ (kills the $A$ term): $3(-2)+5=B(-2-1)$, so $-1=-3B$, giving $B=\dfrac13$.

Check by adding the pieces back: $\dfrac{8/3}{x-1}+\dfrac{1/3}{x+2}=\dfrac{8(x+2)/3+(x-1)/3}{(x-1)(x+2)}=\dfrac{9x+15}{3(x-1)(x+2)}=\dfrac{3x+5}{(x-1)(x+2)}$. Matches.

Integrating is now two easy logarithms: $\int\dfrac{3x+5}{(x-1)(x+2)}\,dx=\dfrac83\ln|x-1|+\dfrac13\ln|x+2|+C$.

A repeated factor like $(x-3)^2$ needs one term for every power up to $2$: $\dfrac{A_1}{x-3}+\dfrac{A_2}{(x-3)^2}$, not just a single term. An irreducible quadratic like $x^2+1$ needs a linear numerator instead of a constant: $\dfrac{Ax+B}{x^2+1}$.

The recipe stays the same every time: write the right template for each factor, clear the denominator, plug in convenient $x$-values, solve.
