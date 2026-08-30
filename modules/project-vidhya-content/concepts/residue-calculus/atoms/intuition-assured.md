---
# Alternative body for residue-calculus.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: residue-calculus.intuition.assured
concept_id: residue-calculus
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: residue-calculus-intuition
for_stance: assured
---

Residue $=c_{-1}$ — every formula below just extracts that one Laurent coefficient without writing the whole series.

Simple pole: $\lim_{z\to z_0}(z-z_0)f(z)$, or $p(z_0)/q'(z_0)$ for $f=p/q$ — but only when $q'(z_0)\neq0$; if $q'(z_0)=0$ too, the pole isn't simple, and this shortcut silently gives a wrong number rather than an error.

Order-$n$ pole: $\frac1{(n-1)!}\lim\frac{d^{n-1}}{dz^{n-1}}[(z-z_0)^nf(z)]$ — too small an $n$ leaves division by zero; too large introduces a spurious $0/0$ that still evaluates to a right-looking wrong answer.

Essential singularities take neither formula: no limit exists, so the coefficient comes from the Laurent series term by term — $e^{1/z}$ at $z=0$ has residue $1$ (the $z^{-1}$ coefficient in $\sum z^{-n}/n!$), found by inspection.

Only poles **inside** $C$ enter $\oint_Cf\,dz=2\pi i\sum\text{Res}$.
