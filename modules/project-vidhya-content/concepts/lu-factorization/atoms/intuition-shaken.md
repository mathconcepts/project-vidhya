---
# Alternative body for lu-factorization.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: lu-factorization.intuition.shaken
concept_id: lu-factorization
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: lu-factorization.intuition
for_stance: shaken
---

Picture solving $Ax=b$ in two stages. $L$ records the row operations that simplify the system; $U$ is the simplified system itself. Multiply them back together and you recover $A$: $LU=A$. Once both are known, a new $b$ takes two easy passes — forward through $L$, backward through $U$ — instead of full elimination again.
