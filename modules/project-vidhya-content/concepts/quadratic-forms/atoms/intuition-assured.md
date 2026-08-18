---
# Alternative body for quadratic-forms.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: quadratic-forms.intuition.assured
concept_id: quadratic-forms
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: quadratic-forms.intuition
for_stance: assured
---

Level curves of $f(\mathbf{x})=\mathbf{x}^TA\mathbf{x}$ are ellipsoids exactly when $A$ is positive (or negative) definite, and a saddle the moment one eigenvalue flips sign — the eigenvalues literally are the axis lengths of the level-curve bowl after diagonalization.

**Faster than eigenvalues, most of the time:** Sylvester's criterion — all leading principal minors positive $\Rightarrow$ positive definite — decides definiteness from determinants alone, no characteristic polynomial required.

**The false generalisation to watch for:** a semidefinite form (some $\lambda_i=0$) is not indefinite. Zero eigenvalues mean flat directions, not sign changes — check for zeros before concluding "mixed signs."
