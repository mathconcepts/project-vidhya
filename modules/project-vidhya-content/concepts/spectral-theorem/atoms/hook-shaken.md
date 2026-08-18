---
# Alternative body for spectral-theorem.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: spectral-theorem.hook.shaken
concept_id: spectral-theorem
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: spectral-theorem.hook
for_stance: shaken
---

Take a symmetric matrix. Its eigenvectors point in perpendicular directions, always.

Line the axes up along those directions, and the matrix stops mixing coordinates — it only stretches.

That decomposition, $A = Q\Lambda Q^T$, is the Spectral Theorem, and it's what makes $\sqrt{A}$ computable.
