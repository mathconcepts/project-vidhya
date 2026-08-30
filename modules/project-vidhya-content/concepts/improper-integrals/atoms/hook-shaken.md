---
# Alternative body for improper-integrals.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: improper-integrals.hook.shaken
concept_id: improper-integrals
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: improper-integrals.hook
for_stance: shaken
---

At $R=1000$: $\int_1^{1000}\frac{dx}{x^2}=1-\frac{1}{1000}=0.999$ — already almost $1$, and a bigger $R$ barely moves it. But $\int_1^{1000}\frac{dx}{x}=\ln(1000)\approx6.9$, and it keeps climbing without bound as $R$ grows. Same shape, opposite fates.
