---
# Alternative body for boolean-algebra.worked-example, stance `assured`.
id: boolean-algebra.worked-example.assured
concept_id: boolean-algebra
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: boolean-algebra.worked-example
for_stance: assured
---

**Problem:** Minimize $F(A,B,C)=\Sigma m(1,3,5,6,7)$.

Read the groups directly: minterms $1,3,5,7$ all have $C=1$ — spot this from the odd-numbered minterms in a $3$-variable map, no plotting needed once the pattern is recognized. Minterms $6,7$ both have $AB=11$.

$$\boxed{F = C + AB}$$

**Worth knowing:** the K-map has $2^3=8$ cells; a function covering $5$ of them can't simplify below $2$ terms here, because a single $4$-cell group covers at most $4$ of the $5$ ones, leaving at least one minterm for a second group — always check whether the largest group misses any minterm before declaring the minimization complete.
