---
# Alternative body for probability-basics.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: probability-basics.hook.assured
concept_id: probability-basics
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: probability-basics.hook
for_stance: assured
---

$P(A\mid B)$ and $P(B\mid A)$ are only equal when $P(A)=P(B)$ — swap them by accident and a diagnostic-test claim ("95% of sick patients test positive") silently becomes a claim about how many positive testers are actually sick, an entirely different, usually much smaller number once the disease's base rate is folded in. This reversal — the prosecutor's fallacy — is this topic's signature trap, and Bayes' theorem exists specifically to convert one conditional into the other correctly, never by assuming they're interchangeable.
