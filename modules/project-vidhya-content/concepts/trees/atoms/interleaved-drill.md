---
id: trees.interleaved-drill
concept_id: trees
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: trees → graph connectivity.**

Take the 4-cycle $C_4$: vertices $\{1,2,3,4\}$, edges $\{1$–$2, 2$–$3, 3$–$4, 4$–$1\}$.

**Question 1 (graph connectivity):** What are $\kappa(C_4)$ and $\lambda(C_4)$?

*Answer:* Both equal $2$. Every vertex has degree $2$, so removing any single vertex or any single edge still leaves the remaining vertices joined by the rest of the cycle — it takes two removals of either kind to actually break it apart.

**Question 2 (trees):** How many distinct spanning trees does $C_4$ have?

*Answer:* $4$. Remove any one of the four edges and the remaining three edges connect all four vertices with no cycle left — a valid spanning tree. Removing a different edge each time gives a different tree, and there's no other way to drop down to $3$ edges while staying connected, so the count is exactly $4$ (confirmed by the Matrix-Tree theorem).

**Why this drill exists:** $\lambda(C_4)=2$ tells you it takes **two** edge removals to disconnect the cycle — but that same fact is what guarantees removing exactly **one** edge always leaves it connected and acyclic, i.e., a spanning tree. Students often treat edge connectivity and spanning-tree counting as unrelated topics, missing that a cycle's edge connectivity is precisely why each single-edge removal is guaranteed safe.
