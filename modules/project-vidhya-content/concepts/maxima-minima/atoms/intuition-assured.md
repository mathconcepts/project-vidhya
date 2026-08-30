---
# Alternative body for maxima-minima.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: maxima-minima.intuition.assured
concept_id: maxima-minima
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: maxima-minima-intuition
for_stance: assured
---

A critical point is necessary, never sufficient: $f(x)=x^3$ has $f'(0)=0$, yet $0$ is neither a local max nor min — $f$ is increasing on both sides, an inflection point with a horizontal tangent, not an extremum. The first derivative test catches this correctly (same sign on both sides $\Rightarrow$ neither); the second derivative test cannot, since $f''(0)=0$ is genuinely inconclusive there, not a coin-flip default to "probably fine."

The multivariable analog is $D=0$: the discriminant test is silent, not neutral. $f(x,y)=x^4+y^4$ and $f(x,y)=x^4-y^4$ both have $D=0$ at the origin (every second partial vanishes), yet the first has a minimum there and the second a saddle — the quadratic approximation the discriminant relies on has nothing to say once every second-order term vanishes, and only direct examination of $f$ near the point resolves it.

Reporting "critical point, therefore extremum" is the mark-loser in both settings; $D=0$ or $f''=0$ means *do more work*, not *assume the obvious case*.
