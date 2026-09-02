---
id: vector-spaces.common-traps
concept_id: vector-spaces
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: vector-spaces.micro-exercise
---

**Trap 1 — Skipping a subspace condition.** A subspace must contain the zero vector AND be closed under both addition and scalar multiplication. Missing any one disqualifies it.

**Trap 2 — Assuming "has non-zero vectors" implies subspace.** $\{(x,y):x+y=1\}$ contains plenty of vectors but is not a subspace because $(0,0)\notin$ it.

**Trap 3 — Miscounting dimension.** Dimension is the size of a minimal spanning set (a basis) — not the number of non-zero components in some vector you happen to look at.

**Trap 4 — Union confused with intersection.** The intersection of two subspaces is always a subspace; the union almost never is (the $x$-axis and $y$-axis are each subspaces of $\mathbb{R}^2$, but their union isn't closed under addition).
