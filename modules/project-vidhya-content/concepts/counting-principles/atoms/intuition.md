---
id: counting-principles.intuition
concept_id: counting-principles
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
---

Think of a counting problem as a tree. Each decision is a branching point: choose a first item, then for every choice you already made, branch again for the second. The total number of complete paths through the tree is the product of the branch counts at each level — that is the whole multiplication principle, no formula required to see why it is true.

Permutations are just this tree where every branch is a distinct, ordered path: arranging 3 books picks a book for slot 1, then one of the remaining 2 for slot 2, then the last for slot 3 — $3\times2\times1$ paths, and $A,B,C$ counts separately from $C,B,A$.

Combinations collapse that same tree. If order inside the selection doesn't matter, every group of $r$ chosen items was counted $r!$ times over in the permutation tree — once per ordering. Divide the permutation count by $r!$ and the overcounting disappears: $C(n,r) = P(n,r)/r!$.

The pigeonhole principle is the tree's opposite move: instead of counting paths, it counts capacity. Put $n+1$ items into $n$ boxes and at least one box holds two — no tree, no formula, just a capacity argument that guarantees a collision exists without ever finding it.
