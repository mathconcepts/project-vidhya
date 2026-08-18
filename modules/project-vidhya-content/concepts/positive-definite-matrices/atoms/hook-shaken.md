---
# Alternative body for positive-definite-matrices.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: positive-definite-matrices.hook.shaken
concept_id: positive-definite-matrices
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: positive-definite-matrices.hook
for_stance: shaken
---

Pick any vector $x \ne 0$. Compute $x^TAx$ — a single number.

If that number always comes out positive, no matter which vector you picked, $A$ is positive definite.

GATE tests this with a shortcut: check the leading principal minors instead of trying every vector.
