---
id: counting-principles.formal-definition
concept_id: counting-principles
atom_type: formal_definition
bloom_level: 2
difficulty: 0.24
exam_ids: ["*"]
---

**Fundamental Counting Principle (Product Rule)**: If event A can occur in $m$ ways and event B can occur in $n$ ways, then both events can occur in sequence in $m \times n$ ways.

**Permutation**: An ordered arrangement of $r$ objects selected from $n$ distinct objects. 
$$P(n, r) = \frac{n!}{(n-r)!}$$
Geometric interpretation: each position has progressively fewer choices — position 1 has $n$ choices, position 2 has $n-1$ choices, etc.

**Combination**: An unordered selection of $r$ objects from $n$ distinct objects.
$$C(n, r) = \binom{n}{r} = \frac{n!}{r!(n-r)!}$$
Geometric interpretation: combinations equal permutations divided by the number of ways to rearrange the selected $r$ objects among themselves.
