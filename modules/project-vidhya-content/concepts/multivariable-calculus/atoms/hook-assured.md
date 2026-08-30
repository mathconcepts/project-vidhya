---
# Alternative body for multivariable-calculus.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: multivariable-calculus.hook.assured
concept_id: multivariable-calculus
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: multivariable-calculus.hook
for_stance: assured
---

GATE's giveaway is "find the rate of change of $f$ in the direction $\mathbf v$" — a directional-derivative question, and the reflex mistake is dotting the gradient with $\mathbf v$ as given, skipping normalization to a unit vector first. $D_{\mathbf v}f=\nabla f\cdot\hat{\mathbf v}$ needs $\hat{\mathbf v}=\mathbf v/\|\mathbf v\|$; using an un-normalized $\mathbf v$ scales the answer by $\|\mathbf v\|$ — a wrong number that still looks entirely plausible.
