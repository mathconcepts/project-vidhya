---
# Alternative body for fourier-series.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: fourier-series.intuition.assured
concept_id: fourier-series
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: fourier-series-intuition
for_stance: assured
---

Symmetry first, always: $f$ even kills every $b_n$, $f$ odd kills $a_0$ and every $a_n$ — check parity before writing a single integral, and integrate over $[0,L]$ only once you have.

Two places cost marks past that. At a jump discontinuity the Dirichlet-condition series does not converge to $f$ on either side; it converges to the average $\tfrac{f(x^+)+f(x^-)}{2}$ — quoting the value on one side of the jump as "the sum" is a wrong answer, not an approximation. And Gibbs overshoot near a jump sits at roughly $9\%$ of the jump height *regardless of how many terms you keep*; adding terms narrows the overshoot's width, it does not shrink its height, so "just take more terms" is not the fix a rushed answer implies.

Parseval turns a series problem into an integral problem and back: $\tfrac1L\int_{-L}^{L}f^2\,dx=\tfrac{a_0^2}{2}+\sum(a_n^2+b_n^2)$ is how GATE gets you to evaluate $\sum 1/n^2$ without summing anything directly — compute the coefficients for the relevant $f$, plug the LHS integral, and read off the series value.
