---
id: functions-combinatorics.common-traps
concept_id: functions-combinatorics
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1 — Using $\binom{n}{k}$ when order actually matters.** If the problem assigns distinct roles (rankings, ordered arrangements, an injective mapping), the count is $P(n,k)$, not $\binom{n}{k}$ — dividing by $k!$ when you shouldn't undercounts by that factor.

**Trap 2 — Subtracting only the "all-in-one-box" cases for onto-counting with $3+$ boxes.** That shortcut happens to work for $2$ boxes but undercounts what to exclude once $3$ or more boxes are involved; full inclusion-exclusion is needed.

**Trap 3 — Forgetting injective requires $k\le n$.** An injection from a $k$-set into an $n$-set is impossible when $k>n$ — check this before applying $P(n,k)$.

**Trap 4 — Assuming injective + finite + equal-size automatically means bijective for infinite sets too.** True for finite sets of equal size, but false the moment the sets are infinite — a common false generalization once a problem shifts to infinite domains.
