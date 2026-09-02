---
# Alternative body for boolean-algebra.intuition, stance `assured`.
id: boolean-algebra.intuition.assured
concept_id: boolean-algebra
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
modality: visual
variant_of: boolean-algebra.intuition
for_stance: assured
---

Grouping cells must be sized as a power of $2$ — $1,2,4,8,\dots$ — never $3$ or $5$. $F=\Sigma m(1,3,5,7)$ groups as one $4$-cell block (all sharing $C=1$), reducing to a single literal, $C$; $\Sigma m(6,7)$ groups as a $2$-cell block, reducing to two literals, $AB$.

The mark-costing mistake: forcing three adjacent $1$s into one term. A $3$-cell group is never valid — the correct move is always to cover with overlapping power-of-$2$ groups instead, letting one cell belong to more than one group when that yields a bigger, simpler block overall.
