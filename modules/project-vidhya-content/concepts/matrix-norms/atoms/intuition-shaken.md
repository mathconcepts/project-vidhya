---
# Alternative body for matrix-norms.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: matrix-norms.intuition.shaken
concept_id: matrix-norms
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: matrix-norms.intuition
for_stance: shaken
---

Feed a unit-length vector into $A$. The output's length depends on which direction you fed in.

$\|A\|$ is the *biggest* output length over every possible unit input — the maximum stretch.

Feed a unit vector into $A^{-1}$ too. $\kappa(A) = \|A\|\cdot\|A^{-1}\|$ multiplies the two biggest stretches together.

Check: stretch the same amount everywhere and $\kappa(A)$ sits near $1$. Stretch one direction hard and barely touch another, and $\kappa(A)$ grows large.
