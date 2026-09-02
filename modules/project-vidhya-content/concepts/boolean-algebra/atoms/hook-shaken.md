---
# Alternative body for boolean-algebra.hook, stance `shaken`.
id: boolean-algebra.hook.shaken
concept_id: boolean-algebra
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: boolean-algebra.hook
for_stance: shaken
---

Five product terms build one truth table: $A'B'C, A'BC, AB'C, ABC', ABC$.

Look for what repeats. Three terms have $C=1$: the first, second, and third. Two terms have $A=1$ and $B=1$: the fourth and fifth.

Group by $C$: those three collapse to just $C$. Group by $AB$: those two collapse to just $AB$.

Five terms become two: $C+AB$.
