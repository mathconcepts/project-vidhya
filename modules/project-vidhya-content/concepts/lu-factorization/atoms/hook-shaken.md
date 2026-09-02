---
# Alternative body for lu-factorization.hook, served when the learner stance
# is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, and the check
# made explicit. No praise, no reassurance, no mention of feelings.
id: lu-factorization.hook.shaken
concept_id: lu-factorization
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: lu-factorization.hook
for_stance: shaken
---

A matrix has a shape before you compute anything: elimination always zeroes the same positions below the diagonal, whatever $b$ turns out to be. Do that elimination once. Save the multipliers as $L$. Save the result as $U$. For any new $b$, two easy triangular solves replace the whole elimination. Check: multiply $L$ and $U$ back together — you must get $A$ exactly.
