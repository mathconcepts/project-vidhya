---
id: boolean-algebra.common-traps
concept_id: boolean-algebra
atom_type: common_traps
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
---

**Trap 1 — Forgetting wraparound adjacency.** The leftmost and rightmost columns (and top/bottom rows) of a K-map are adjacent. A grouping that seems to need wrapping around the edge is still valid — missing it leaves a non-minimal expression.

**Trap 2 — Grouping a non-power-of-2 number of cells.** Groups must be sized $1,2,4,8,\dots$. Three adjacent $1$s cannot form one term; cover them with overlapping valid-sized groups instead.

**Trap 3 — Reading the minterm's binary code in the wrong bit order.** Minterm $6$ is $110$ in $(A,B,C)$ order — check which variable is the most significant bit before reading off a grouping.

**Trap 4 — Forgetting overlap is allowed.** The same $1$-cell can belong to more than one group in the final cover; refusing to reuse a cell often blocks the truly minimal solution.
