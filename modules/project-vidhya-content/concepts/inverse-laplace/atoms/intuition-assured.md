---
# Alternative body for inverse-laplace.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: inverse-laplace.intuition.assured
concept_id: inverse-laplace
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: inverse-laplace-intuition
for_stance: assured
---

Pole location decides the *form* of $f(t)$ before any table is consulted: real pole → exponential, imaginary pair → undamped sinusoid, complex pair $-a\pm j\omega$ → damped sinusoid, repeated pole → an extra polynomial factor on the exponential. Stating that form first is the fast check a rushed decomposition skips.

The error worth naming: for a repeated pole $(s+a)^2$, writing only $\dfrac{A}{(s+a)^2}$ and dropping the accompanying $\dfrac{B}{s+a}$ term is an incomplete decomposition, not a simplification — and the two constants come from different operations, $A=\lim_{s\to-a}(s+a)^2F(s)$ but $B=\frac{d}{ds}\big[(s+a)^2F(s)\big]_{s=-a}$, a derivative, not another limit.

Convolution is the fallback for a denominator that partial fractions makes ugly — an irreducible cubic, or a product of factors from two unrelated systems — not the default route; reach for it only once direct decomposition looks worse than the convolution integral itself.
