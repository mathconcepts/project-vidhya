---
# Alternative body for improper-integrals.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: improper-integrals.hook.assured
concept_id: improper-integrals
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: improper-integrals.hook
for_stance: assured
---

GATE's stock phrasing is "does $\int_a^\infty f\,dx$ converge" for a function that visibly shrinks toward $0$ — and "it shrinks to zero" is exactly the wrong rule to reach for. $1/x\to0$ too, yet $\int_1^\infty\frac{dx}{x}=\ln R\to\infty$: decaying to zero is necessary but nowhere near sufficient. The real threshold, from the $p$-test, is decay strictly faster than $1/x$ — $p>1$, not $p\ge0$.
