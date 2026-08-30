---
# Alternative body for integration-by-parts.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: integration-by-parts.hook.assured
concept_id: integration-by-parts
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: integration-by-parts.hook
for_stance: assured
---

GATE hides this behind "integrate the product $f(x)g(x)$" — and the wrong instinct is treating $\int$ as if it distributes over multiplication the way it does over addition, writing $\int fg\,dx\overset{?}{=}\big(\int f\,dx\big)\big(\int g\,dx\big)$. It never does — that identity fails even for $f=g=x$. Integration by parts exists precisely because no such shortcut exists for products, only for sums.
