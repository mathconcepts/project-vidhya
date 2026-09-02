---
id: counting-principles.formal-definition
concept_id: counting-principles
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Fundamental counting principle (product rule).** If a first choice can be made in $m$ ways and, independent of that choice, a second in $n$ ways, the pair can be made in $m\times n$ ways.

**Permutation** (ordered selection of $r$ from $n$ distinct objects):
$$P(n,r) = \frac{n!}{(n-r)!}$$

**Combination** (unordered selection):
$$C(n,r) = \binom{n}{r} = \frac{n!}{r!(n-r)!}$$

**Pigeonhole principle.** If $n+1$ objects are placed into $n$ boxes, at least one box contains 2 or more objects.

Use $P(n,r)$ when the question distinguishes arrangements by order (rankings, passwords, seating); use $C(n,r)$ when it doesn't (committees, unordered groups). A common wrong instinct is computing $P(n,r)$ for a committee-selection problem — that inflates the true count by exactly $r!$, since it counts every same committee once per internal ordering.
