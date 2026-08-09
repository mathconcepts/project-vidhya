---
id: group-theory-basics.common-traps
concept_id: group-theory-basics
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting closure in verification**: When checking if a set with an operation is a group, students verify associativity and identity but forget to check that the operation actually keeps you in the set (closure). Example: $(\\mathbb{Z}, -)$ fails closure (no, it doesn't), but it fails associativity. **Check first**: if $a \cdot b$ is defined for all $a, b \in G$, closure is satisfied; the real trap is operations like "greatest common divisor" on integers where the result might exceed the set's range.
- **Confusing order of element with order of group**: The order of an element $a$ (smallest $n$ with $a^n = e$) is NOT the same as the order of the group (cardinality $|G|$). By Lagrange, element orders divide group order, but they're distinct concepts. **Test**: in $\\mathbb{Z}_{12}$, the element 2 has order 6, not 12.
- **Misapplying Lagrange's theorem**: Lagrange says subgroup order divides group order, but NOT that every divisor gives a subgroup. For $\\mathbb{Z}_6$, divisors of 6 are 1, 2, 3, 6, but not every divisor necessarily generates a subgroup (though in cyclic groups, every divisor does). **Key point**: Lagrange is a necessary condition, not sufficient in general.
