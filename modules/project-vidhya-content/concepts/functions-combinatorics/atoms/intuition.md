---
id: functions-combinatorics.intuition
concept_id: functions-combinatorics
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
---

Start from a common conflation: that "choose $2$ from $5$" and "arrange $2$ from $5$" give the same count. Test it on $n=5,k=2$.

Choosing $\{1,2\}$ from $\{1,2,3,4,5\}$ as a set: it's the same choice whether you picked $1$ then $2$, or $2$ then $1$. Order doesn't matter — there are $\binom{5}{2}=10$ such subsets.

Arranging $2$ chosen from $5$ into an ordered pair: $(1,2)$ and $(2,1)$ are different arrangements. There are $P(5,2)=5\times4=20$ — exactly double the combination count, since each unordered pair corresponds to $2! = 2$ orderings.

The ratio $P(n,k)/\binom{n}{k}=k!$ always holds, and it's the single fact that resolves "do I divide by $k!$ or not" — divide when order doesn't matter (a committee, a subset), don't when it does (a ranking, a sequence of distinct assigned roles).
