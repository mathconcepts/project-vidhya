---
# Alternative body for z-transform.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: z-transform.hook.assured
concept_id: z-transform
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: z-transform.hook
for_stance: assured
---

$z^{-n}$ is the shift operator; that part is automatic by now. What actually gets tested is the ROC: $X(z)=\frac{z}{z-a}$ names *both* the causal $a^nu[n]$ (ROC $|z|>|a|$) and the anti-causal $-a^nu[-n-1]$ (ROC $|z|<|a|$) equally well — same closed form, opposite sequence, and the exam question is usually engineered to make you forget the sequence depends on which one you were given.
