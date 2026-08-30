---
# Alternative body for partial-fractions.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: partial-fractions.intuition.assured
concept_id: partial-fractions
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: partial-fractions-intuition
for_stance: assured
---

"Irreducible" means no real roots, checked by the discriminant $b^2-4ac<0$ — not "doesn't factor with nice integers." $x^2-2$ has no rational roots but factors over the reals as $(x-\sqrt2)(x+\sqrt2)$; treating it as an irreducible quadratic and writing $\frac{Ax+B}{x^2-2}$ is the wrong template, since it genuinely splits into two linear factors, each needing its own $\frac{A}{x-a}$ term.

For a repeated factor $(x-a)^k$, cover-up only ever recovers the *highest*-power coefficient, $A_k$, directly (set $x=a$ after clearing denominators). The remaining $A_1,\dots,A_{k-1}$ need either coefficient comparison or successive substitution at other convenient values — cover-up is not a full solve for every constant once $k>1$.

The uniqueness of the decomposition is what makes two different solving methods — cover-up at special values versus comparing coefficients of like powers — always agree on the same constants; a mismatch between the two methods means an arithmetic error occurred, not that either method is invalid.
