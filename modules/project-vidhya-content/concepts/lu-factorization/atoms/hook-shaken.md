---
# Alternative body for lu-factorization.hook, served when the learner stance
# is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: lu-factorization.hook.shaken
concept_id: lu-factorization
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: lu-factorization.hook
for_stance: shaken
---

Solving $Ax=b$ over and over with different $b$'s? Split $A=LU$ once. Then each new $b$ takes two fast steps — solve $Ly=b$, then $Ux=y$ — instead of full elimination every time.
