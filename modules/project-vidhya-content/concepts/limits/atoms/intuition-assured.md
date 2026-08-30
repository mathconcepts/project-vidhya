---
# Alternative body for limits.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: limits.intuition.assured
concept_id: limits
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: limits-intuition
for_stance: assured
---

The composition law, $\lim_{x\to a}g(f(x))=g(L)$, needs $g$ continuous *at $L$*, not merely well-defined there — swap in a $g$ with a removable discontinuity at $L$ and the identity fails even though $g(L)$ exists. Verifying continuity at the limit point is the step skipped under pressure.

The squeeze theorem's inequality only needs to hold in a punctured neighborhood of $a$, never everywhere: $g(x)\le f(x)\le h(x)$ can fail far from $a$ and the theorem is unaffected, since a limit is a statement about behavior arbitrarily close to $a$, nowhere else.

L'Hôpital's rule must be re-checked for indeterminacy before every repeated application, not applied mechanically until the algebra runs out: differentiate once, substitute again, and if the new form is no longer $\frac00$ or $\frac\infty\infty$, stop — differentiating a determinate expression again gives a number with no relationship to the original limit.
