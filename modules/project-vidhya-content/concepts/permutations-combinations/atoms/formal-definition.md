---
id: permutations-combinations.formal-definition
concept_id: permutations-combinations
atom_type: formal_definition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
---

**Fundamental counting principle**: if a first task can be done in $m$ ways and a second, independent task in $n$ ways, both together can be done in $m \times n$ ways.

**Permutation ($^nP_r$)**: the number of ways to arrange $r$ items chosen from $n$ distinct items, order mattering: $^nP_r = \dfrac{n!}{(n-r)!}$.

**Combination ($^nC_r$)**: the number of ways to choose $r$ items from $n$ distinct items, order not mattering: $^nC_r = \dfrac{n!}{r!(n-r)!}$.

**Arrangements with repetition allowed**: $n^r$, for $r$ positions each independently filled from $n$ choices.

**Arrangements with some items identical**: for $n$ items where one kind repeats $p$ times, another $q$ times, and so on, the number of distinct arrangements is $\dfrac{n!}{p!\,q!\,\cdots}$.

**Circular permutations**: $n$ distinct items arranged around a circle, where rotations are considered identical, give $(n-1)!$ distinct arrangements.

**Restriction — items together**: treat the group that must stay together as one single block; arrange the blocks, then arrange the items inside the block separately.

**Restriction — items never together**: arrange the remaining items first, then place the restricted items into the gaps between them.

**Grouping and distribution**: dividing $n$ distinct items into groups of specified sizes; divide by the factorial of the number of groups when equal-sized groups are otherwise indistinguishable. Distributing $r$ identical items into $n$ distinct boxes (any number per box) uses $^{n+r-1}C_{r-1}$.
