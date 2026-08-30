---
# Alternative body for counting-principles.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: counting-principles.hook.assured
concept_id: counting-principles
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: counting-principles.hook
for_stance: assured
---

$P(n,r)$ and $C(n,r)$ differ only by a factor of $r!$, but picking the wrong one changes an answer by that whole factor, not by a rounding error. The tell is never the wording's length — it's whether swapping two chosen objects produces a distinguishable outcome. Team selection: order irrelevant, use $C$. Podium ranking: order relevant, use $P$. Pigeonhole needs no counting at all: $n+1$ objects into $n$ boxes forces a repeat, and GATE uses it to prove existence, not to compute a value — exactly the step a "count something" reflex skips past.
