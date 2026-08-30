---
# Alternative body for taylor-laurent.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: taylor-laurent.hook.shaken
concept_id: taylor-laurent
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: taylor-laurent.hook
for_stance: shaken
---

Near $z=0$, $\dfrac1{1-z}=1+z+z^2+z^3+\cdots$ — an ordinary Taylor series, matching the function as closely as you like with enough terms. Now look at $\dfrac1z$ itself at $z=0$: no Taylor series exists there, but allow the single negative power $z^{-1}$, and the "series" is just $\dfrac1z$ — one term, already exact. That negative-power piece is what Laurent adds.
