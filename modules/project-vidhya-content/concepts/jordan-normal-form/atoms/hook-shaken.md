---
# Alternative body for jordan-normal-form.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: jordan-normal-form.hook.shaken
concept_id: jordan-normal-form
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: jordan-normal-form.hook
for_stance: shaken
---

Some matrices lack enough eigenvectors to go fully diagonal.

$\begin{pmatrix} 2 & 1 \\ 0 & 2 \end{pmatrix}$ is one — close, though: diagonal entries, plus a single $1$ above.

That shape is a Jordan block. Every matrix reaches one, diagonal or not.
