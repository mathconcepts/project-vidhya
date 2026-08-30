---
# Alternative body for chain-rule.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: chain-rule.hook.assured
concept_id: chain-rule
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: chain-rule.hook
for_stance: assured
---

GATE dresses this up as "related rates": two quantities tied through a shared intermediate, one rate given, another asked for. Under time pressure it is easy to differentiate the outer expression as if the intermediate were the variable being solved for, dropping the factor $\frac{dr}{dt}$ that the chain rule demands whenever you differentiate with respect to something other than the variable a rate was actually given for. Anywhere a quantity is expressed *through* another — volume through radius, distance through angle, temperature through position — its time-derivative inherits that intermediate's own rate as a multiplier.
