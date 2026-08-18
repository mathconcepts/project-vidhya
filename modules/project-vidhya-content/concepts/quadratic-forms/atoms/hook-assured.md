---
# Alternative body for quadratic-forms.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: quadratic-forms.hook.assured
concept_id: quadratic-forms
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: quadratic-forms.hook
for_stance: assured
---

$f(\mathbf{x})=\mathbf{x}^TA\mathbf{x}$ classifies by the sign pattern of $A$'s eigenvalues — all positive (positive definite), all negative (negative definite), mixed (indefinite), any zero (semidefinite). Classification is an eigenvalue question dressed as a polynomial one, and every algorithm in the topic exists to avoid computing the eigenvalues directly when a shortcut applies.
