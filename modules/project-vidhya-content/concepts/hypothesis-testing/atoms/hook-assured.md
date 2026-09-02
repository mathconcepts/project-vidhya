---
# Alternative body for hypothesis-testing.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: hypothesis-testing.hook.assured
concept_id: hypothesis-testing
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: hypothesis-testing.hook
for_stance: assured
---

A p-value of 0.03 is not a 3% chance that $H_0$ is true — it means a 3% chance of seeing data this extreme IF $H_0$ were true, a statement about the data, not the hypothesis. That reversal — probability of data given hypothesis, versus hypothesis given data — is exactly the direction confusion Bayes warns about elsewhere in this syllabus, and it's the fastest wrong answer here: reading "$p<0.05$, so there's a 95% chance the effect is real" treats a conditional as if it pointed the other way.
