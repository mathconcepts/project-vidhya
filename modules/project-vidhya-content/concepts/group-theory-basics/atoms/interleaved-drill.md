---
id: group-theory-basics.interleaved_drill
concept_id: group-theory-basics
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: sets & relations → group theory basics.**

A subgroup's cosets and a relation's equivalence classes are the same object seen from two directions. Define $a \sim b$ on $(\mathbb{Z}_6, +)$ by $a \sim b \iff a - b \in H$, where $H = \{0, 3\}$.

**Question 1 (relations):** Is $\sim$ an equivalence relation? Check reflexive, symmetric, transitive.

*Answer:* Yes. Reflexive: $a - a = 0 \in H$. Symmetric: if $a-b \in H$ then $b-a = -(a-b) \in H$ too, since $H$ is closed under inverses ($-3 \equiv 3 \pmod 6$, still in $H$). Transitive: if $a - b \in H$ and $b - c \in H$, their sum $a - c \in H$ by closure of $H$. All three hold because $H$ is a subgroup — the group axioms are exactly what makes $\sim$ well-behaved.

**Question 2 (group theory):** List the equivalence classes of $\sim$. How do they compare to the left cosets of $H$ in $(\mathbb{Z}_6, +)$?

*Answer:* The classes are $\{0,3\}$, $\{1,4\}$, $\{2,5\}$ — identical to the cosets $0+H$, $1+H$, $2+H$ computed directly. A subgroup's cosets ARE the equivalence classes of "differ by an element of $H$"; that is why cosets always partition $G$ into equal-sized, non-overlapping pieces without a separate proof.

**Why this drill exists:** students verify Lagrange's theorem by checking that cosets partition $G$, but treat the partitioning as a fact about groups alone — missing that it is really the sets-and-relations fact "every equivalence relation partitions its set," applied to one specific relation built from a subgroup.
