---
# Alternative body for conformal-mapping.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: conformal-mapping.hook.shaken
concept_id: conformal-mapping
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: conformal-mapping.hook
for_stance: shaken
---

Take two lines crossing at $90°$ at some point, and apply $f(z)=iz$: every point rotates by $90°$ together, so the two lines still cross at $90°$ afterward — the angle survived even though every point moved. That's conformal: angles preserved, not lengths. It works here since $f$ is analytic there and $f'(z)=i\neq0$; analytic alone is not the whole condition.
