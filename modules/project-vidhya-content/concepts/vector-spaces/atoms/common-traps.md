---
id: vector-spaces.common-traps
concept_id: vector-spaces
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: vector-spaces.micro-exercise
---

**Trap 1 — Skipping a subspace condition.** A subspace is a smaller vector space sitting fully inside a bigger one — but not every subset qualifies. To count as one, a set must contain the zero vector (the all-zeros vector), and it must be closed under addition and scalar multiplication — meaning: add any two vectors in the set, or scale any vector in it by a number, and the result must still land inside the set. Miss even one of these conditions, and it's disqualified.

**Trap 2 — Assuming "has non-zero vectors" implies subspace.** Having plenty of vectors in a set proves nothing on its own. Take $\{(x,y):x+y=1\}$ — it has infinitely many vectors, but it isn't a subspace, because $(0,0)\notin$ it. No zero vector, no subspace — you don't even need to check the other conditions.

**Trap 3 — Miscounting dimension.** Dimension is the size of a basis — a minimal spanning set, meaning the smallest collection of vectors that can build every other vector in the space through addition and scaling. It has nothing to do with counting non-zero components in some random vector you happen to be looking at. Confusing the two is how students undercount or overcount dimension.

**Trap 4 — Union confused with intersection.** The intersection of two subspaces (the vectors common to both) is always a subspace. The union (everything in either one) almost never is — students assume combining two subspaces stays safe, but it doesn't. Example: the $x$-axis and $y$-axis are each subspaces of $\mathbb{R}^2$, but their union isn't closed under addition — add a vector from the $x$-axis to one from the $y$-axis and you land off both axes.
