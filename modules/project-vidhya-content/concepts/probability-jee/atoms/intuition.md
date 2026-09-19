---
id: probability-jee.intuition
concept_id: probability-jee
atom_type: intuition
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
---

Picture the whole day's output of items as one big box. Once you are told an item is defective, your universe shrinks — you are no longer looking inside the whole box, only inside the smaller pile of defective items sitting within it. Conditional probability, $P(A|B)$, simply asks: within that smaller, shrunken pile, what fraction came from $A$? Nothing more exotic than a fraction of a fraction.

The total probability theorem is the step BEFORE that shrinking can even happen: it says the whole "defective pile" is built by adding up each machine's own contribution to it — Machine A's share of defectives, plus Machine B's, plus Machine C's. You cannot ask "what fraction of the defective pile" until you know how big that pile is in the first place.

Bayes' theorem is just those two ideas stacked together: (one machine's contribution to the defective pile) divided by (the whole defective pile's size). Independence, meanwhile, is the special case where the pile never shrinks unevenly at all — knowing $B$ happened does not change $A$'s share of anything, because $P(A|B)$ already equals plain $P(A)$.
