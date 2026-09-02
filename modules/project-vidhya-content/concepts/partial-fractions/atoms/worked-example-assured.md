---
# Alternative body for partial-fractions.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: partial-fractions.worked_example.assured
concept_id: partial-fractions
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: partial-fractions-worked-example
for_stance: assured
---

Cover-up skips the algebra entirely for distinct linear factors: cover $(x-2)$, evaluate what remains at $x=2$: $A=\frac{2+1}{2+3}=\frac35$. Cover $(x+3)$, evaluate at $x=-3$: $B=\frac{-3+1}{-3-2}=\frac25$.

**Answer:** $\boxed{\dfrac35\ln|x-2|+\dfrac25\ln|x+3|+C}$.

The shortcut only goes this far for a repeated factor: on $\dfrac{N(x)}{(x-2)^2(x+3)}=\dfrac{A}{x-2}+\dfrac{B}{(x-2)^2}+\dfrac{C}{x+3}$, cover-up cleanly recovers $B$ (set $x=2$) and $C$ (set $x=-3$) — but not $A$, since covering $(x-2)$ once still leaves a factor of $(x-2)$ in what remains, and that does not vanish at $x=2$ the way it does for a simple factor. $A$ needs coefficient comparison or a third convenient substitution instead.

The condition that makes cover-up valid at all: the factor must appear to exactly the first power in what's being covered, and the value substituted must be the *actual root* of that factor — an irreducible quadratic factor has no single real root to substitute, so cover-up does not apply to it.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: partial fractions of (x+1)/[(x−2)(x+3)]","steps":[{"prompt":"What is the correct partial fraction template for (x+1)/[(x-2)(x+3)]?","hint":"Two distinct linear factors → one constant term per factor: A/(x-2) + B/(x+3).","answer":"A/(x-2) + B/(x+3), because the denominator has two distinct linear factors, each requiring one constant numerator."},{"prompt":"Using the cover-up rule, what is the value of A (the constant over the x-2 factor)?","hint":"Cover (x-2) in the denominator, then substitute x=2 into the rest of the fraction.","answer":"A = (2+1)/(2+3) = 3/5. Cover (x-2), evaluate (x+1)/(x+3) at x=2: 3/5."},{"prompt":"What is the final integrated result?","hint":"Integrate A/(x-2) and B/(x+3) separately — each gives a natural log.","answer":"(3/5)ln|x-2| + (2/5)ln|x+3| + C. Each term 1/(x-a) integrates to ln|x-a|."}]}
```
