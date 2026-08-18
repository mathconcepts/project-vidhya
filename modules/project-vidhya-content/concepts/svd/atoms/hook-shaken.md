---
# Alternative body for svd.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: svd.hook.shaken
concept_id: svd
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: svd.hook
for_stance: shaken
---

## Three simple moves, in order

Any matrix $A$, even a non-square one, breaks into three steps: rotate, stretch along fixed axes, rotate again.

Write that as $A = U\Sigma V^T$. $\Sigma$ holds the stretch amounts — the singular values — largest first.

Every matrix has this decomposition. Nothing needs to be square, symmetric, or even invertible first.
