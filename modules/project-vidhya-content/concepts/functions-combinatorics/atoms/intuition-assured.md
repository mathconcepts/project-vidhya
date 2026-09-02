---
# Alternative body for functions-combinatorics.intuition, stance `assured`.
id: functions-combinatorics.intuition.assured
concept_id: functions-combinatorics
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
variant_of: functions-combinatorics.intuition
for_stance: assured
---

$P(n,k)=n!/(n-k)!$ and $\binom{n}{k}=n!/(k!(n-k)!)$ differ by exactly $k!$ — the number of ways to order $k$ chosen items. Reach for $P(n,k)$ whenever the $k$ selected items get distinct roles (an injection $[k]\to[n]$, first/second/third place); reach for $\binom{n}{k}$ when they don't (a subset, an unordered committee).

The mark-costing confusion: counting the number of **injections** from a $k$-element set into an $n$-element set. It is $P(n,k)$, not $\binom{n}{k}$ — an injection assigns each of the $k$ domain elements to a distinct codomain element, and which domain element lands where matters, exactly the ordered case.
