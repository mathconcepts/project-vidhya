---
# Alternative body for mean-value-theorems.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: mean-value-theorems.hook.assured
concept_id: mean-value-theorems
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: mean-value-theorems.hook
for_stance: assured
---

"Show there exists $c\in(a,b)$ with $f'(c)=\dots$" is an MVT existence claim on GATE, not a computation to just solve. What usually goes wrong under pressure: setting $f'(c)$ equal to the average slope and solving, without first confirming $f$ is continuous on $[a,b]$ **and** differentiable on $(a,b)$. A function with a removable discontinuity or a corner inside the interval can fail to have any such $c$ at all — the hypotheses are not boilerplate, they are what makes the guarantee true.
