---
# Alternative body for functions-combinatorics.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: functions-combinatorics.hook.assured
concept_id: functions-combinatorics
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: functions-combinatorics.hook
for_stance: assured
---

The exact place a confident answer goes wrong: "choose three people from ten" sounds like one question but is two. If the three end up in labeled roles — chair, secretary, treasurer — order matters and the count is $P(10,3)=720$. If the three just form a committee with no roles, order doesn't matter and the count is $C(10,3)=120$ — six times smaller, because each committee of three can be labeled $3!=6$ ways. Reading "choose" as automatically unordered is the most frequent way this topic gets a confident answer wrong.
