---
# Alternative body for numerical-linear-algebra.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: numerical-linear-algebra.hook.shaken
concept_id: numerical-linear-algebra
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: numerical-linear-algebra.hook
for_stance: shaken
---

$A=\begin{pmatrix}2&1\\4&3\end{pmatrix}$. Eliminate the first column: multiplier $m=4/2=2$, new row 2 is $(4,3)-2(2,1)=(0,1)$. That single subtraction is the entire first step of Gaussian elimination — record the multiplier, subtract, move to the next column.
