---
# Alternative body for rank-nullity.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: rank-nullity.hook.shaken
concept_id: rank-nullity
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: rank-nullity.hook
for_stance: shaken
---

Take $A=\begin{pmatrix}1&2\\2&4\end{pmatrix}$. Row 2 is just $2\times$ row 1, so only one row is truly independent: rank $=1$. That leaves $1$ dimension "lost" out of $2$ columns — the nullity. Rank counts what survives; nullity counts what collapses to zero.
