---
# Alternative body for partial-fractions.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: partial-fractions.hook.shaken
concept_id: partial-fractions
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: partial-fractions.hook
for_stance: shaken
---

Check the split: $\frac{1/2}{x-1}-\frac{1/2}{x+1}=\frac{(x+1)-(x-1)}{2(x-1)(x+1)}=\frac{2}{2(x^2-1)}=\frac{1}{x^2-1}$. Matches. Now $\int\frac{dx}{x^2-1}=\frac12\ln|x-1|-\frac12\ln|x+1|+C$ — two easy logarithms instead of one hard fraction.
