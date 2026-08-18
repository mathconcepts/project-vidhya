---
# Alternative body for matrix-norms.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: matrix-norms.hook.shaken
concept_id: matrix-norms
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: matrix-norms.hook
for_stance: shaken
---

A matrix norm $\|A\|$ is one number measuring how "big" a matrix is — like a vector's length, but for a matrix.

The condition number $\kappa(A)$ measures something sharper: how much a small input error blows up in the output. Large $\kappa(A)$ means small mistakes get amplified.
