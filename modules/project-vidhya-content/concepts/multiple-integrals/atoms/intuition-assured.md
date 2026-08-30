---
# Alternative body for multiple-integrals.intuition, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: multiple-integrals.intuition.assured
concept_id: multiple-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: multiple-integrals.intuition
for_stance: assured
---

The polar Jacobian $r$ is not decorative: a small rectangle $dr\times d\theta$ in polar space maps to a region in the $xy$-plane whose actual area is approximately $r\,dr\,d\theta$, not $dr\,d\theta$ — the arc length swept at radius $r$ scales with $r$ itself. Dropping the factor of $r$ silently over-weights the region near the origin and under-weights it far out; $\iint_R f\,dA=\int\int f(r\cos\theta,r\sin\theta)\,r\,dr\,d\theta$ is not a labeling convention, it is the actual area-correction term.

Reversing the order of integration is not a bounds-swap on the same numbers: a region bounded above by $y=x^2$ and below by $y=0$ for $x\in[0,1]$ (a "type I" description, $x$ outer) needs its boundary re-expressed as $x$ ranging over $[\sqrt y,1]$ for $y\in[0,1]$ (a "type II" description) to integrate $dy\,dx\to dx\,dy$ correctly — the curve that was a bound on $y$ becomes a bound on $x$, and vice versa.

Some regions genuinely resist a single simple order in either direction and must be split into pieces first; recognizing that requirement before attempting a swap saves a doomed algebra pass.
