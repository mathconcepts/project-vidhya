---
# Alternative body for partial-fractions.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: partial-fractions.hook.assured
concept_id: partial-fractions
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: partial-fractions.hook
for_stance: assured
---

"Decompose $\frac{P(x)}{Q(x)}$ into partial fractions" on GATE hides a precondition — and the common misstep is applying the standard template directly when $\deg(P)\ge\deg(Q)$. An improper fraction needs polynomial long division *first*, splitting off a polynomial plus a genuinely proper remainder; only that remainder gets the $\frac{A}{x-a}$ treatment. Skipping the division and decomposing the improper fraction as-is produces constants that satisfy no consistent identity.
