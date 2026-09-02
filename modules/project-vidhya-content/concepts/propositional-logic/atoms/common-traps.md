---
id: propositional-logic.common-traps
concept_id: propositional-logic
atom_type: common_traps
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
---

**Trap 1 — Reading $P\to Q$ as symmetric.** $P\to Q$ and $Q\to P$ (the converse) are independent statements; a true implication says nothing about its converse.

**Trap 2 — Confusing inverse with contrapositive.** $\neg P\to\neg Q$ (inverse) is only as reliable as the converse; $\neg Q\to\neg P$ (contrapositive) is the one guaranteed equivalent to $P\to Q$.

**Trap 3 — Forgetting the vacuous-true row.** $P\to Q$ is true whenever $P$ is false, regardless of $Q$ — two of the four rows are "true by default," not because anything meaningful happened.

**Trap 4 — Treating $\oplus$ (XOR) like $\lor$.** $P\lor Q$ is true when both are true; $P\oplus Q$ is false in that same row. Reading a stated "exclusive or" as ordinary OR flips one row of every truth table it appears in.
