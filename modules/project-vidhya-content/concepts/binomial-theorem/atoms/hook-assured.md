---
id: binomial-theorem.hook-assured
concept_id: binomial-theorem
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: binomial-theorem.hook
for_stance: assured
---

Remainder of $7^{103}$ mod $25$: write $7^{103}=7(50-1)^{51}$ and expand. The trick generalises further than it looks. It works for ANY base written as (multiple of the divisor) $\pm\, 1$, and it works whether the exponent outside is odd or even — the sign of the surviving term is what changes, not the method. Try $11^{50}$ mod $4$: $11=12-1$, and $12$ is a multiple of $4$, so $11^{50}=(12-1)^{50}$, and now the surviving term is $r=50$ giving $(-1)^{50}=1$, not $-1$. The one place this fails: if the divisor doesn't cleanly divide the "multiple" part you chose — pick $50$, not $49$ or $51$, as the base you subtract from, or the whole cancellation collapses.
