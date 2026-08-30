---
# Alternative body for complex-integration.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: complex-integration.intuition.assured
concept_id: complex-integration
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: complex-integration-intuition
for_stance: assured
---

Two conditions travel together, and dropping either invalidates the zero: $f$ analytic *on and inside* $C$, and $C$ simple and closed. $\oint_{|z|=1}dz/z=2\pi i$, not $0$, because analyticity fails at the single interior point $z=0$ — one bad point anywhere inside is enough.

Cauchy's Integral Formula needs $z_0$ *strictly* inside $C$: on the boundary the integral is undefined (the integrand blows up on $C$ itself); outside it, the formula gives $0$, a genuinely different statement, not a degenerate case of the same one.

Where marks are actually lost: a contour enclosing two or more singularities can't be fed straight into the single-pole formula — partial-fraction each pole out first, or move directly to the residue theorem, never plug a multi-pole integrand into $f(z_0)=\frac1{2\pi i}\oint\frac{f}{z-z_0}dz$ as if $f$ itself stayed analytic inside.

The ML bound is a ceiling, not the value: $|\oint f\,dz|\le ML$ rules an answer out, never computes one.
