---
id: functions-combinatorics.formal-definition
concept_id: functions-combinatorics
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

A function $f:A\to B$ is **injective** if distinct inputs give distinct outputs, **surjective** if every element of $B$ is hit, and **bijective** if both. Counting formulas:

$$P(n,k)=\frac{n!}{(n-k)!} \qquad \binom{n}{k}=\frac{n!}{k!(n-k)!}$$

$P(n,k)$ counts ordered selections (arrangements, injections into an $n$-set); $\binom{n}{k}$ counts unordered selections (subsets). The number of **surjections** from a $k$-set onto an $n$-set uses inclusion-exclusion: $\sum_{i=0}^{n}(-1)^i\binom{n}{i}(n-i)^k$.

**Method selector.** Ask whether the $k$ chosen elements receive distinguishable roles (positions, an ordered sequence, an injective mapping) — if yes, use $P(n,k)$; if the chosen elements form an unordered group, use $\binom{n}{k}$. Applying $\binom{n}{k}$ to a problem that secretly assigns roles (e.g. "first, second, third prize") undercounts by a factor of $k!$ — the single most common combinatorics slip on this topic.
