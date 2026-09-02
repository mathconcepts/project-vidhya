---
id: graph-basics.common-traps
concept_id: graph-basics
atom_type: common_traps
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
tested_by_atom: graph-basics.micro-exercise
---

**Trap 1 — A loop counts twice.** A self-loop at $v$ adds 2 to $\deg(v)$, not 1, since both its endpoints land on $v$. Miss this and every degree involving a loop comes out one short.

**Trap 2 — An odd degree sum is impossible, not a red flag to fix.** If a proposed degree sequence sums to an odd number, no graph realizes it — full stop. There's no valid graph hiding somewhere; the sequence itself is invalid.

**Trap 3 — Degree is not the same as number of distinct neighbors, in a multigraph.** Two parallel edges between $u$ and $v$ add 2 to each degree even though $v$ has only one neighbor, $u$.

**Trap 4 — Simple-graph degree tops out at $n-1$.** A vertex can't be adjacent to itself (no loops in a simple graph) or to more vertices than exist besides itself.
