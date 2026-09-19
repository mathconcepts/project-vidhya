---
id: probability-jee.intuition-shaken
concept_id: probability-jee
atom_type: intuition
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
variant_of: probability-jee.intuition
for_stance: shaken
---

Picture all of a day's items as one box. Told that an item is defective, your box shrinks — now you are only looking at the smaller pile of defective items. $P(A|B)$ just asks: within that smaller pile, what fraction came from $A$?

The total probability theorem builds that pile in the first place: add up each machine's own share of defectives — Machine A's share, plus B's, plus C's. You need the pile's total size before asking about any one fraction of it.

Bayes' theorem is those two steps together: one machine's share of the pile, divided by the whole pile. Independence means the pile never shrinks unevenly — $P(A|B)$ equals plain $P(A)$.
