---
# Alternative body for boolean-algebra.hook, stance `assured`.
id: boolean-algebra.hook.assured
concept_id: boolean-algebra
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: boolean-algebra.hook
for_stance: assured
---

Minterms $\{1,3,5,7\}$ (all with $C=1$) plus $\{6,7\}$ (both with $A=B=1$) minimize $F$ to $C+AB$ — five terms collapse to two.

The distinction worth marks: a Karnaugh map's adjacency wraps around the edges (leftmost and rightmost columns are adjacent, as are top and bottom rows), so a valid grouping can straddle the map's boundary. Missing wraparound adjacency is the single most common reason a K-map minimization looks "stuck" at more terms than the true minimum.
