---
id: counting-principles.common-traps
concept_id: counting-principles
atom_type: common_traps
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
---

**Trap 1 — Choosing $P$ when the problem means $C$.** If a "team" or "committee" is unordered, dividing by $r!$ is not optional; skipping it inflates every count by exactly $r!$.

**Trap 2 — Treating repeated items as distinct.** Arranging letters with repeats (e.g. MISSISSIPPI) is not $n!$; divide by the factorial of each repeated letter's count, or you overcount every distinguishable arrangement multiple times.

**Trap 3 — Misreading "at least" as "exactly."** "At least 2 women" includes 2, 3, *and* 4 women — a solution that only computes the 2-women case is silently discarding valid outcomes.

**Trap 4 — Applying pigeonhole backwards.** Pigeonhole guarantees a collision exists; it never identifies *which* box collides or how many collide beyond "at least one has 2." Don't overclaim what the count actually proves.
