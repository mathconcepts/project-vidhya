---
# Alternative body for recurrence-relations.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: recurrence-relations.hook.shaken
concept_id: recurrence-relations
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: recurrence-relations.hook
for_stance: shaken
---

Start a sequence at $a_1=1,\ a_2=1$, and let each next term be the sum of the two before it: $a_3=1+1=2$, $a_4=1+2=3$, $a_5=2+3=5$. Five terms, computed one addition at a time, no formula used yet. Is there a direct way to reach $a_{40}$ without computing the $38$ terms in between?
