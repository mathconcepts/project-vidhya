---
id: group-theory-basics.exam_pattern
concept_id: group-theory-basics
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **MCQ "which one is NOT a group" questions** present four $(set, operation)$ pairs and ask which one fails to form a group. The failure is usually closure or the inverse axiom, not associativity — check those two first and leave associativity for last.
- **MSQ "which axioms hold" questions** ask you to select every axiom a given structure satisfies, rather than judging the whole thing "group" or "not group" in one step. This tests whether you can certify closure and inverse independently instead of assuming a group-like operation gets all four for free.
- **NAT questions** ask for the order of an element, computed as $n/\gcd(n,a)$ in $(\mathbb{Z}_n, +)$, or for the index $[G:H]$ of a subgroup, computed as $|G|/|H|$.

  Example: order of $4$ in $(\mathbb{Z}_{10}, +)$: $\gcd(10,4)=2$, so $\text{ord}(4) = 10/2 = 5$.

- **Time budget:** a four-axiom verification on an explicit small set should take under $90$ seconds per candidate structure; an order-of-element NAT question should take under $30$ seconds once the $n/\gcd(n,a)$ formula is recalled instead of listing multiples by hand.
