---
id: rank-nullity.common-traps
concept_id: rank-nullity
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: rank-nullity.micro-exercise
---

**Trap 1 — Confusing rank with row/column count.** Rank is NOT simply the number of rows or columns. It's the number of *linearly independent* rows or columns — rows that each add genuinely new information, none of them just a combination of the others. A matrix can have plenty of rows and still have a small rank if several rows are repeating the same information in disguise.

**Trap 2 — Forgetting the theorem itself.** The rank-nullity theorem says $\text{rank}(A)+\text{nullity}(A)=n$, where nullity is simply the dimension (the number of independent directions) of the solution set to $A\mathbf{x}=\mathbf{0}$. Students often compute the rank correctly, then try to work out the nullity from scratch instead of just plugging into this formula — wasted effort on a sum they could get for free.

**Trap 3 — Counting dependent rows as rank.** If one row is just a multiple of another (say, row 2 equals 3 times row 1), the two rows together still count as only one toward the rank — they're carrying the same information twice. Simply counting every non-zero row, without checking whether one is hiding inside another, overcounts the rank.

**Trap 4 — Subtracting from the wrong dimension.** Nullity is $n-\text{rank}(A)$, where $n$ is the number of **columns** — not rows. For a square matrix this slip doesn't show up, since rows and columns match anyway. For a non-square matrix they differ, and using the row count instead gives a wrong answer.
