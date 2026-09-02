---
id: sets-relations.interleaved-drill
concept_id: sets-relations
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: sets & relations → functions.**

A function $f:A\to B$ is a special relation: for every $a\in A$, exactly one pair $(a,f(a))$ appears — no element of $A$ maps to two different outputs.

**Question 1 (relations):** Is $R=\{(1,2),(1,3),(2,2)\}$ on $\{1,2,3\}$ a function from $\{1,2\}$ to $\{2,3\}$?

*Answer:* No — $1$ appears twice, paired with both $2$ and $3$. A function permits at most one output per input; $R$ violates that.

**Question 2 (functions):** Remove one pair from $R$ so it becomes a valid function $\{1,2\}\to\{2,3\}$. Is your result injective?

*Answer:* Removing either $(1,2)$ or $(1,3)$ works. Keeping $(1,3),(2,2)$: $1\to3$ and $2\to2$ hit different outputs, so yes — injective (in fact bijective onto $\{2,3\}$).

**Why this drill exists:** students learn "relation" and "function" as separate topics and miss that every function IS a relation with one extra restriction — the same ordered-pair thinking that catches a broken equivalence relation catches a broken function definition too.
