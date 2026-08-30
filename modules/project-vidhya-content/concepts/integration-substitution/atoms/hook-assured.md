---
# Alternative body for integration-substitution.hook, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: integration-substitution.hook.assured
concept_id: integration-substitution
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: integration-substitution.hook
for_stance: assured
---

An integrand where one factor is visibly the derivative of another's argument is GATE's signature setup for substitution — and the common misfire is substituting $u$ for the inner piece while leaving a stray, un-converted $x$ behind that $du$ never absorbs. A clean substitution rewrites the *entire* integral in terms of $u$, not just the composed piece; if an $x$ survives outside $du$, either back-solve it in terms of $u$ or the substitution is not finished.
