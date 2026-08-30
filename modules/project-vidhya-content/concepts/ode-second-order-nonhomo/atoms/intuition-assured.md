---
# Alternative body for ode-second-order-nonhomo-intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: ode-second-order-nonhomo.intuition.assured
concept_id: ode-second-order-nonhomo
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: ode-second-order-nonhomo-intuition
for_stance: assured
---

The undetermined-coefficients trial gets bumped by $x^k$, where $k$ is how many times the forcing rate already appears as a root of the characteristic equation — a single collision needs $\times x$, a double root at that same rate needs $\times x^2$. Missing that bump, not a coefficient-algebra slip, is the standard resonance error.

For $f(x)=\sin(bx)$ alone, the trial still needs both $A\cos(bx)$ and $B\sin(bx)$: differentiating $\sin$ produces $\cos$, so a one-term trial can never balance the equation no matter how carefully $A$ is solved for.

Reach for variation of parameters only once $f(x)$ falls outside the polynomial/exponential/sinusoid catalogue undetermined coefficients handles — not as a longer default replacing the shorter route when the shorter one would have worked.
